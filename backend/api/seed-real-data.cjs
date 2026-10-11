"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcrypt = require("bcrypt");
var prisma = new client_1.PrismaClient();
var facultyList = [
    { name: 'Dr. Subhrajyoti Bordoloi', email: 'sb.mca@aec.ac.in', initial: 'SB', empId: 'FAC-SB-01' },
    { name: 'Dr. Nelson R. Varte', email: 'nv.mca@aec.ac.in', initial: 'NV', empId: 'FAC-NV-02' },
    { name: 'Dr. Maushumi Barooah', email: 'mb.mca@aec.ac.in', initial: 'MB', empId: 'FAC-MB-03' },
    { name: 'Dr. Jyoti Prokash Goswami', email: 'jpg.mca@aec.ac.in', initial: 'JPG', empId: 'FAC-JPG-04' },
    { name: 'Dr. Antara Malakar', email: 'am.mca@aec.ac.in', initial: 'AM', empId: 'FAC-AM-05' },
    { name: 'Dr. Anindita Borah', email: 'ab.mca@aec.ac.in', initial: 'AB', empId: 'FAC-AB-06' },
    { name: 'Faculty ABP', email: 'abp.mca@aec.ac.in', initial: 'ABP', empId: 'FAC-ABP-07' },
    { name: 'Faculty BG', email: 'bg.mca@aec.ac.in', initial: 'BG', empId: 'FAC-BG-08' },
];
var timetableData = [
    // MONDAY SEM 1
    { day: 1, sem: 1, start: '08:00', end: '09:00', subject: 'BC - MFCS', faculty: 'AB', type: 'Bridge Course' },
    { day: 1, sem: 1, start: '09:00', end: '11:00', subject: 'LAB PJ', faculty: 'BG', type: 'Lab' },
    { day: 1, sem: 1, start: '11:00', end: '12:00', subject: 'BC - FCSN', faculty: 'JPG', type: 'Bridge Course' },
    { day: 1, sem: 1, start: '13:00', end: '14:00', subject: 'DAA', faculty: 'ABP', type: 'Theory' },
    { day: 1, sem: 1, start: '14:00', end: '15:00', subject: 'COA', faculty: 'AM', type: 'Theory' },
    { day: 1, sem: 1, start: '15:00', end: '16:00', subject: 'ADS', faculty: 'JPG', type: 'Theory' },
    // MONDAY SEM 3
    { day: 1, sem: 3, start: '08:00', end: '10:00', subject: 'Mini Project/Seminar', faculty: 'ABP', type: 'Project' },
    { day: 1, sem: 3, start: '10:00', end: '11:00', subject: 'E II [CD, CNS]', faculty: 'AB', type: 'Theory' },
    { day: 1, sem: 3, start: '11:00', end: '12:00', subject: 'IDS', faculty: 'BG', type: 'Theory' },
    { day: 1, sem: 3, start: '13:00', end: '14:00', subject: 'WTS', faculty: 'NV', type: 'Theory' },
    { day: 1, sem: 3, start: '14:00', end: '16:00', subject: 'NBA Work', faculty: 'SB', type: 'Admin' }, // Assigned SB randomly for work
    // TUESDAY SEM 1
    { day: 2, sem: 1, start: '08:00', end: '09:00', subject: 'OS', faculty: 'SB', type: 'Theory' },
    { day: 2, sem: 1, start: '09:00', end: '11:00', subject: 'LAB PJ', faculty: 'AM', type: 'Lab' },
    { day: 2, sem: 1, start: '11:00', end: '12:00', subject: 'PTPJ', faculty: 'BG', type: 'Theory' },
    { day: 2, sem: 1, start: '13:00', end: '14:00', subject: 'BC - IPDSC', faculty: 'ABP', type: 'Bridge Course' },
    { day: 2, sem: 1, start: '14:00', end: '15:00', subject: 'BC - MFCS', faculty: 'AB', type: 'Bridge Course' },
    { day: 2, sem: 1, start: '15:00', end: '16:00', subject: 'PTPJ', faculty: 'BG', type: 'Tutorial' }, // TC
    // TUESDAY SEM 3
    { day: 2, sem: 3, start: '08:00', end: '10:00', subject: 'Mini Project/Seminar', faculty: 'JPG', type: 'Project' },
    { day: 2, sem: 3, start: '10:00', end: '11:00', subject: 'E III [ES]', faculty: 'NV', type: 'Theory' },
    { day: 2, sem: 3, start: '11:00', end: '12:00', subject: 'AIML', faculty: 'MB', type: 'Theory' },
    { day: 2, sem: 3, start: '13:00', end: '14:00', subject: 'IDS', faculty: 'BG', type: 'Theory' },
    { day: 2, sem: 3, start: '14:00', end: '15:00', subject: 'WTS', faculty: 'NV', type: 'Theory' },
    { day: 2, sem: 3, start: '15:00', end: '16:00', subject: 'E II [CD, CNS]', faculty: 'AM', type: 'Theory' },
    // WEDNESDAY SEM 1
    { day: 3, sem: 1, start: '08:00', end: '09:00', subject: 'BC - IPDSC', faculty: 'ABP', type: 'Bridge Course' },
    { day: 3, sem: 1, start: '09:00', end: '11:00', subject: 'LAB PJ', faculty: 'AB', type: 'Lab' },
    { day: 3, sem: 1, start: '11:00', end: '12:00', subject: 'COA', faculty: 'AM', type: 'Theory' },
    { day: 3, sem: 1, start: '13:00', end: '14:00', subject: 'ADS', faculty: 'JPG', type: 'Theory' },
    { day: 3, sem: 1, start: '14:00', end: '15:00', subject: 'BC - FCSN', faculty: 'MB', type: 'Bridge Course' },
    { day: 3, sem: 1, start: '15:00', end: '16:00', subject: 'OS', faculty: 'SB', type: 'Tutorial' }, // TC
    // WEDNESDAY SEM 3
    { day: 3, sem: 3, start: '08:00', end: '10:00', subject: 'Mini Project/Seminar', faculty: 'SB', type: 'Project' },
    { day: 3, sem: 3, start: '10:00', end: '11:00', subject: 'E III [ES]', faculty: 'NV', type: 'Theory' },
    { day: 3, sem: 3, start: '11:00', end: '12:00', subject: 'IDS', faculty: 'BG', type: 'Theory' },
    { day: 3, sem: 3, start: '13:00', end: '14:00', subject: 'E II [CD, CNS]', faculty: 'AM', type: 'Theory' },
    { day: 3, sem: 3, start: '14:00', end: '15:00', subject: 'AIML', faculty: 'AB', type: 'Tutorial' }, // TC
    { day: 3, sem: 3, start: '15:00', end: '16:00', subject: 'WTS', faculty: 'NV', type: 'Theory' },
    // THURSDAY SEM 1
    { day: 4, sem: 1, start: '08:00', end: '09:00', subject: 'OS', faculty: 'SB', type: 'Theory' },
    { day: 4, sem: 1, start: '09:00', end: '11:00', subject: 'LAB PJ', faculty: 'NV', type: 'Lab' },
    { day: 4, sem: 1, start: '11:00', end: '12:00', subject: 'PTPJ', faculty: 'BG', type: 'Theory' },
    { day: 4, sem: 1, start: '13:00', end: '14:00', subject: 'DAA', faculty: 'ABP', type: 'Theory' },
    { day: 4, sem: 1, start: '14:00', end: '15:00', subject: 'DAA', faculty: 'ABP', type: 'Tutorial' }, // TC
    { day: 4, sem: 1, start: '15:00', end: '16:00', subject: 'BC - FCSN', faculty: 'MB', type: 'Bridge Course' },
    // THURSDAY SEM 3
    { day: 4, sem: 3, start: '08:00', end: '11:00', subject: 'Mini Project/Seminar', faculty: 'AB', type: 'Project' },
    { day: 4, sem: 3, start: '11:00', end: '12:00', subject: 'AIML', faculty: 'MB', type: 'Theory' },
    { day: 4, sem: 3, start: '13:00', end: '14:00', subject: 'E III [ES]', faculty: 'NV', type: 'Theory' },
    { day: 4, sem: 3, start: '14:00', end: '16:00', subject: 'NBA Work', faculty: 'SB', type: 'Admin' },
    // FRIDAY SEM 1
    { day: 5, sem: 1, start: '08:00', end: '10:00', subject: 'BC - Lab CDS', faculty: 'SB', type: 'Lab' },
    { day: 5, sem: 1, start: '10:00', end: '11:00', subject: 'COA', faculty: 'AM', type: 'Theory' },
    { day: 5, sem: 1, start: '11:00', end: '12:00', subject: 'DAA', faculty: 'ABP', type: 'Theory' },
    { day: 5, sem: 1, start: '13:00', end: '14:00', subject: 'PTPJ', faculty: 'BG', type: 'Theory' },
    { day: 5, sem: 1, start: '14:00', end: '15:00', subject: 'OS', faculty: 'SB', type: 'Theory' },
    { day: 5, sem: 1, start: '15:00', end: '16:00', subject: 'BC - IPDSC', faculty: 'ABP', type: 'Bridge Course' },
    // FRIDAY SEM 3
    { day: 5, sem: 3, start: '08:00', end: '10:00', subject: 'Mini Project/Seminar', faculty: 'MB', type: 'Project' },
    { day: 5, sem: 3, start: '10:00', end: '11:00', subject: 'IDS', faculty: 'BG', type: 'Tutorial' }, // TC
    { day: 5, sem: 3, start: '11:00', end: '12:00', subject: 'WTS', faculty: 'NV', type: 'Tutorial' }, // TC
    { day: 5, sem: 3, start: '13:00', end: '14:00', subject: 'AIML', faculty: 'MB', type: 'Theory' },
    { day: 5, sem: 3, start: '14:00', end: '16:00', subject: 'NBA Work', faculty: 'SB', type: 'Admin' },
    // SATURDAY SEM 1
    { day: 6, sem: 1, start: '08:00', end: '10:00', subject: 'BC - Lab CDS', faculty: 'AM', type: 'Lab' },
    { day: 6, sem: 1, start: '10:00', end: '11:00', subject: 'BC - MFCS', faculty: 'AB', type: 'Bridge Course' },
    { day: 6, sem: 1, start: '11:00', end: '12:00', subject: 'ADS', faculty: 'JPG', type: 'Theory' },
    // SATURDAY SEM 3
    { day: 6, sem: 3, start: '08:00', end: '12:00', subject: 'Mini Project/Seminar', faculty: 'NV', type: 'Project' },
];
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var hashedPassword, dept, facultyMap, _i, facultyList_1, fac, nameParts, firstName, lastName, user, profile, term1, term3, classroom, _a, timetableData_1, entry, term, facultyId, subjectCode, subject, section, assignment;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, bcrypt.hash('Faculty@123', 10)];
                case 1:
                    hashedPassword = _b.sent();
                    return [4 /*yield*/, prisma.department.findFirst({ where: { name: 'Computer Applications' } })];
                case 2:
                    dept = _b.sent();
                    if (!!dept) return [3 /*break*/, 4];
                    return [4 /*yield*/, prisma.department.create({ data: { name: 'Computer Applications', institution: 'Assam Engineering College' } })];
                case 3:
                    dept = _b.sent();
                    _b.label = 4;
                case 4:
                    facultyMap = new Map();
                    _i = 0, facultyList_1 = facultyList;
                    _b.label = 5;
                case 5:
                    if (!(_i < facultyList_1.length)) return [3 /*break*/, 11];
                    fac = facultyList_1[_i];
                    nameParts = fac.name.split(' ');
                    firstName = nameParts[0] + ' ' + nameParts[1];
                    lastName = nameParts.slice(2).join(' ') || '';
                    return [4 /*yield*/, prisma.user.findUnique({ where: { email: fac.email } })];
                case 6:
                    user = _b.sent();
                    if (!!user) return [3 /*break*/, 8];
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                email: fac.email,
                                firstName: firstName,
                                lastName: lastName,
                                password: hashedPassword,
                                role: 'FACULTY'
                            }
                        })];
                case 7:
                    user = _b.sent();
                    _b.label = 8;
                case 8: return [4 /*yield*/, prisma.facultyProfile.upsert({
                        where: { employeeId: fac.empId },
                        update: { userId: user.id, departmentId: dept.id },
                        create: { userId: user.id, employeeId: fac.empId, departmentId: dept.id }
                    })];
                case 9:
                    profile = _b.sent();
                    facultyMap.set(fac.initial, profile.id);
                    _b.label = 10;
                case 10:
                    _i++;
                    return [3 /*break*/, 5];
                case 11: return [4 /*yield*/, prisma.academicTerm.upsert({
                        where: { id: 'term-mca-1-2026' },
                        update: { isCurrent: true },
                        create: { id: 'term-mca-1-2026', year: 2026, name: 'MCA 1st Semester (2026)', startDate: new Date('2026-08-17'), endDate: new Date('2026-12-31'), isCurrent: true }
                    }).catch(function () { return __awaiter(_this, void 0, void 0, function () {
                        var t;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, prisma.academicTerm.findFirst({ where: { name: 'MCA 1st Semester (2026)' } })];
                                case 1:
                                    t = _a.sent();
                                    if (!!t) return [3 /*break*/, 3];
                                    return [4 /*yield*/, prisma.academicTerm.create({ data: { year: 2026, name: 'MCA 1st Semester (2026)', startDate: new Date('2026-08-17'), endDate: new Date('2026-12-31'), isCurrent: true } })];
                                case 2:
                                    t = _a.sent();
                                    _a.label = 3;
                                case 3: return [2 /*return*/, t];
                            }
                        });
                    }); })];
                case 12:
                    term1 = _b.sent();
                    return [4 /*yield*/, prisma.academicTerm.upsert({
                            where: { id: 'term-mca-3-2026' },
                            update: { isCurrent: true },
                            create: { id: 'term-mca-3-2026', year: 2026, name: 'MCA 3rd Semester (2026)', startDate: new Date('2026-08-03'), endDate: new Date('2026-12-31'), isCurrent: true }
                        }).catch(function () { return __awaiter(_this, void 0, void 0, function () {
                            var t;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, prisma.academicTerm.findFirst({ where: { name: 'MCA 3rd Semester (2026)' } })];
                                    case 1:
                                        t = _a.sent();
                                        if (!!t) return [3 /*break*/, 3];
                                        return [4 /*yield*/, prisma.academicTerm.create({ data: { year: 2026, name: 'MCA 3rd Semester (2026)', startDate: new Date('2026-08-03'), endDate: new Date('2026-12-31'), isCurrent: true } })];
                                    case 2:
                                        t = _a.sent();
                                        _a.label = 3;
                                    case 3: return [2 /*return*/, t];
                                }
                            });
                        }); })];
                case 13:
                    term3 = _b.sent();
                    return [4 /*yield*/, prisma.classroom.findFirst({ where: { name: 'MCA Room 1' } })];
                case 14:
                    classroom = _b.sent();
                    if (!!classroom) return [3 /*break*/, 16];
                    return [4 /*yield*/, prisma.classroom.create({
                            data: { name: 'MCA Room 1', departmentId: dept.id, building: 'Main Block', floor: '1st Floor' }
                        })];
                case 15:
                    classroom = _b.sent();
                    _b.label = 16;
                case 16: 
                // Clear existing timetable
                return [4 /*yield*/, prisma.timetableEntry.deleteMany({})];
                case 17:
                    // Clear existing timetable
                    _b.sent();
                    _a = 0, timetableData_1 = timetableData;
                    _b.label = 18;
                case 18:
                    if (!(_a < timetableData_1.length)) return [3 /*break*/, 30];
                    entry = timetableData_1[_a];
                    term = entry.sem === 1 ? term1 : term3;
                    facultyId = facultyMap.get(entry.faculty);
                    subjectCode = "TT-".concat(entry.subject.replace(/[^a-zA-Z0-9]/g, '').toUpperCase());
                    return [4 /*yield*/, prisma.subject.findFirst({ where: { code: subjectCode } })];
                case 19:
                    subject = _b.sent();
                    if (!!subject) return [3 /*break*/, 21];
                    return [4 /*yield*/, prisma.subject.create({
                            data: { name: entry.subject, code: subjectCode, departmentId: dept.id }
                        })];
                case 20:
                    subject = _b.sent();
                    _b.label = 21;
                case 21: return [4 /*yield*/, prisma.section.findFirst({ where: { subjectId: subject.id, name: "Sem ".concat(entry.sem) } })];
                case 22:
                    section = _b.sent();
                    if (!!section) return [3 /*break*/, 24];
                    return [4 /*yield*/, prisma.section.create({
                            data: { name: "Sem ".concat(entry.sem), subjectId: subject.id }
                        })];
                case 23:
                    section = _b.sent();
                    _b.label = 24;
                case 24:
                    if (!facultyId) return [3 /*break*/, 27];
                    return [4 /*yield*/, prisma.classAssignment.findFirst({ where: { facultyProfileId: facultyId, sectionId: section.id } })];
                case 25:
                    assignment = _b.sent();
                    if (!!assignment) return [3 /*break*/, 27];
                    return [4 /*yield*/, prisma.classAssignment.create({ data: { facultyProfileId: facultyId, sectionId: section.id } })];
                case 26:
                    _b.sent();
                    _b.label = 27;
                case 27: 
                // Create Timetable Entry
                return [4 /*yield*/, prisma.timetableEntry.create({
                        data: {
                            academicTermId: term.id,
                            sectionId: section.id,
                            classroomId: classroom.id,
                            dayOfWeek: entry.day,
                            startTime: entry.start,
                            endTime: entry.end,
                            subjectType: entry.type
                        }
                    })];
                case 28:
                    // Create Timetable Entry
                    _b.sent();
                    _b.label = 29;
                case 29:
                    _a++;
                    return [3 /*break*/, 18];
                case 30:
                    console.log('Seeded Faculty, Terms, and Timetable successfully!');
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(console.error).finally(function () { return prisma.$disconnect(); });
