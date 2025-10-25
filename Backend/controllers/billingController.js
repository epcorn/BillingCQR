console.log("✅ [Controller] billingController.js file was read.");

const { 
    startOfMonth, endOfMonth, startOfDay, endOfDay, startOfWeek, endOfWeek, 
    addDays, addMonths, differenceInCalendarMonths, getDay 
} = require("date-fns");

const Service = require("../models/Service");
const ServiceReport = require("../models/ServiceReport");
const Contract = require("../models/Contract");
const { logBillingActivity } = require("../utils/logBillingActivity"); // ✅ Import logging function

/**
 * HELPER FUNCTION: Calculate Search Window
 */
const calculateSearchWindow = (service, viewingMonth, viewingYear) => {
    const contractStartDate = new Date(service.contract.startDate);
    const viewingDate = new Date(viewingYear, viewingMonth - 1, 1);
    const today = new Date();

    let searchStart = startOfMonth(viewingDate);
    let searchEnd = endOfMonth(viewingDate);

    switch (service.frequency) {
        case "Monthly":
        case "Thrice A Month":
        case "As An When Called":
            break;
        case "Alternate Monthly": {
            const monthDiff = differenceInCalendarMonths(viewingDate, contractStartDate);
            const blockIndex = Math.floor(monthDiff / 2);
            searchStart = startOfMonth(addMonths(contractStartDate, blockIndex * 2));
            searchEnd = endOfMonth(addMonths(searchStart, 1));
            break;
        }
        case "Quarterly": {
            const monthDiff = differenceInCalendarMonths(viewingDate, contractStartDate);
            const blockIndex = Math.floor(monthDiff / 3);
            searchStart = startOfMonth(addMonths(contractStartDate, blockIndex * 3));
            searchEnd = endOfMonth(addMonths(searchStart, 2));
            break;
        }
        case "Fortnightly": {
            const dayDiff = Math.floor((today - startOfDay(contractStartDate)) / (1000*60*60*24));
            const chunkIndex = Math.floor(dayDiff / 14);
            searchStart = addDays(startOfDay(contractStartDate), chunkIndex*14);
            searchEnd = addDays(searchStart, 14);
            break;
        }
        case "Weekly":
        case "Twice A Week":
        case "Thrice A Week":
            searchStart = startOfWeek(today, { weekStartsOn: getDay(contractStartDate) });
            searchEnd = endOfWeek(today, { weekStartsOn: getDay(contractStartDate) });
            break;
        case "Daily":
        case "Alternate Days":
            searchStart = startOfDay(today);
            searchEnd = endOfDay(today);
            break;
        case "3 Services Once In 4 Months": {
            const monthDiff = differenceInCalendarMonths(viewingDate, contractStartDate);
            const blockIndex = Math.floor(monthDiff / 4);
            searchStart = startOfMonth(addMonths(contractStartDate, blockIndex*4));
            searchEnd = endOfMonth(addMonths(searchStart, 3));
            break;
        }
        case "2 Services Once In 6 Months": {
            const monthDiff = differenceInCalendarMonths(viewingDate, contractStartDate);
            const blockIndex = Math.floor(monthDiff / 6);
            searchStart = startOfMonth(addMonths(contractStartDate, blockIndex*6));
            searchEnd = endOfMonth(addMonths(searchStart, 5));
            break;
        }
        default:
            break;
    }

    return { searchStart, searchEnd };
};

/**
 * DUE CARDS API
 */
exports.getDueBillingCards = async (req, res) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) return res.status(400).json({ msg: "Month and year query required." });

        const dateForMonthName = new Date(`${year}-${month}-01T00:00:00Z`);
        const monthName = dateForMonthName.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
        const monthYearSearchTerm = `${monthName} ${year}`;

        const dueServices = await Service.find({ billingMonths: monthYearSearchTerm })
            .populate({ path: "contract", populate: { path: "services", select: "_id serviceCardNumber" } })
            .sort({ "contract.contractNo": 1, serviceCardNumber: 1 });

        if (!dueServices.length) return res.status(200).json({ message: `No billing cards due for ${monthYearSearchTerm}.`, data: [] });

        const responseData = [];
        for (const service of dueServices) {
            if (!service.contract) continue;
            const { searchStart, searchEnd } = calculateSearchWindow(service, month, year);

            const latestReportInPeriod = await ServiceReport.findOne({
                service: service._id,
                serviceDate: { $gte: searchStart, $lte: searchEnd }
            }).sort({ serviceDate: -1 });

            const contract = service.contract;
            const totalCards = contract.services.length;
            responseData.push({
                serviceId: service._id,
                contractId: contract._id,
                contractNo: contract.contractNo,
                serviceCardNumber: service.serviceCardNumber,
                totalCardsInContract: totalCards,
                serviceCardLabel: `${contract.contractNo} (${service.serviceCardNumber}/${totalCards})`,
                billTo: contract.billToAddress?.name || "",
                shipTo: contract.shipToAddress?.name || "",
                frequency: service.frequency,
                cardFrontImage: service.card || null,
                cardBackImage: latestReportInPeriod?.image?.[0] || null,
                serviceDate: latestReportInPeriod?.serviceDate || null
            });
        }

        res.status(200).json({ data: responseData });
    } catch (error) {
        console.error("Error fetching due billing cards:", error);
        res.status(500).json({ msg: "Server error", error: error.message });
    }
};

/*
 * AFTER JOB API
 */
exports.getAfterJobCards = async (req, res) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) return res.status(400).json({ msg: "Month and year query required." });

        const monthInt = parseInt(month); // 1-12
        const yearInt = parseInt(year);

        const contracts = await Contract.find({
            $or: [
                { "singleBillingConfig.frequencyType": "Bill After Job" },
                { "multiBillingConfig.frequencyType": "Bill After Job" }
            ]
        }).populate("services");

        if (!contracts.length) return res.status(200).json({ data: [] });

        const responseData = [];

        for (const contract of contracts) {
            const totalCards = contract.services.length;

            for (const service of contract.services) {
                const searchStart = new Date(Date.UTC(yearInt, monthInt - 1, 1, 0, 0, 0));
                const searchEnd = new Date(Date.UTC(yearInt, monthInt, 1, 0, 0, 0)); // next month

                const latestReport = await ServiceReport.findOne({
                    service: service._id,
                    serviceDate: { $gte: searchStart, $lt: searchEnd }
                }).sort({ serviceDate: -1 });

                if (!latestReport) continue;

                responseData.push({
                    serviceId: service._id,
                    contractId: contract._id,
                    contractNo: contract.contractNo,
                    serviceCardNumber: service.serviceCardNumber,
                    totalCardsInContract: totalCards,
                    serviceCardLabel: `${contract.contractNo} (${service.serviceCardNumber}/${totalCards})`,
                    billTo: contract.billToAddress?.name || "",
                    shipTo: contract.shipToAddress?.name || "",
                    frequency: "Bill After Job",
                    cardFrontImage: service.card || null,
                    cardBackImage: latestReport.image?.[0] || null,
                    serviceDate: latestReport.serviceDate
                });
            }
        }

        res.status(200).json({ data: responseData });
    } catch (err) {
        console.error("Error in getAfterJobCards:", err);
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

/**
 * Card Download Logging API
 */
exports.logCardDownload = async (req, res) => {
    try {
        const { contractNo, cardSide, cardPath } = req.body;
        if (!req.user) return res.status(401).json({ msg: "Unauthorized" });

        await logBillingActivity({
            userId: req.user._id,
            actionType: "downloadCard",
            additionalInfo: `Downloaded ${cardSide} card for contract ${contractNo}, path: ${cardPath}`
        });

        res.status(200).json({ success: true, msg: "Card download logged" });
    } catch (err) {
        console.error("Error logging card download:", err);
        res.status(500).json({ success: false, msg: "Server error" });
    }
};
