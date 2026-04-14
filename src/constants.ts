import { Student } from './types';

export const INITIAL_STUDENTS: Partial<Student>[] = [
  { stt: 1, name: "Lê Thị Mai Anh", dob: "1/8/2010", gender: "Nữ", group: "To1", address: "Thạch Bàn, Lệ Thủy", email: "maianh2010qt@gmail.com" },
  { stt: 2, name: "Trần Ngọc Bảo", dob: "12/04/2010", gender: "Nam", group: "To2", address: "Thượng Giang, Lệ Thủy", email: "tbao12367@gmail.com" },
  { stt: 3, name: "Lê Văn Gia Bảo", dob: "23/05/2010", gender: "Nam", group: "To1", address: "Phú Thọ, Lệ Thủy", email: "levagiabao@gmail.com" },
  { stt: 4, name: "Nguyễn Thị Diệu Châu", dob: "25/02/2010", gender: "Nữ", group: "To2", address: "Châu Xá, Trường Phú", email: "dre29829@gmail.com" },
  { stt: 5, name: "Lê Thị Kim Chi", dob: "26/02/2010", gender: "Nữ", group: "To2", address: "Mai Hạ, Lệ Thủy", email: "levansu1979qb@gmail.com" },
  { stt: 6, name: "Đoàn Thùy Dương", dob: "06/07/2010", gender: "Nữ", group: "To2", address: "Phú Hòa, Trường Phú", email: "thuyduongf2010@gmail.com" },
  { stt: 7, name: "Trần Vi Minh Đạt", dob: "01/01/2010", gender: "Nam", group: "To3", address: "Thạch Bàn, Trường Phú", email: "datluon8@gmail.com" },
  { stt: 8, name: "Phạm Lê Hân", dob: "10/06/2010", gender: "Nữ", group: "To3", address: "Bang, Kim Ngân", email: "han1006210@gmail.com" },
  { stt: 9, name: "Trần Việt Hoàng", dob: "08/01/2010", gender: "Nam", group: "To4", address: "Nam Tiến, Sen Ngư", email: "tviethoang64@gmail.com" },
  { stt: 10, name: "Nguyễn Thị Huệ", dob: "30/08/2010", gender: "Nữ", group: "To4", address: "Phong Giang, Lệ Thủy", email: "nhue08174@gmail.com" },
  { stt: 11, name: "Đỗ Thị Bích Huyền", dob: "15/11/2010", gender: "Nữ", group: "To2", address: "Xuân Bồ, Lệ Thủy", email: "dothibichhuyen07@gmail.com" },
  { stt: 12, name: "Lê Bảo Khang", dob: "8/5/2010", gender: "Nam", group: "To1", address: "Phú Thọ, Lệ Thủy", email: "lebaokhang748@gmail.com" },
  { stt: 13, name: "Dương Công Khánh", dob: "8/12/2010", gender: "Nam", group: "To2", address: "Mai Thượng, Trường Phú", email: "khanh.081210@gmail.com" },
  { stt: 14, name: "Phan Trung Lộc", dob: "20/02/2010", gender: "Nam", group: "To1", address: "Thạch Bàn, Lệ Thủy", email: "phanloc776@gmail.com" },
  { stt: 15, name: "Nguyễn Thị Ngọc Mai", dob: "28/11/2010", gender: "Nữ", group: "To4", address: "Thượng Giang, Lệ Thủy", email: "ngocmai281110@gmail.com" },
  { stt: 16, name: "Lê Minh Ngọc", dob: "18/08/2010", gender: "Nam", group: "To2", address: "Bang, Kim Ngân", email: "linhho040506@gmail.com" },
  { stt: 17, name: "Trương Gia Nguyên", dob: "27/08/2010", gender: "Nam", group: "To3", address: "Trường Giang, Trường Phú", email: "truongnguyen2010a@gmail.com" },
  { stt: 18, name: "Đoàn Thị Yến Nhi", dob: "17/03/2010", gender: "Nữ", group: "To3", address: "Thạch Bàn, Trường Phú", email: "doanyennhi318@gmail.com" },
  { stt: 19, name: "Nguyễn Trần Uyễn Nhi", dob: "25/01/2010", gender: "Nữ", group: "To1", address: "Thạch Bàn, Lệ Thủy", email: "uyennhinguyentran644@gmail.com" },
  { stt: 20, name: "Trần Hoài Như", dob: "25/09/2010", gender: "Nữ", group: "To3", address: "Lệ Bình, Trường Phú", email: "tranhoainhu874@gmail.com" },
  { stt: 21, name: "Lê Thị Diễm Phương", dob: "7/4/2010", gender: "Nữ", group: "To2", address: "Phú Hòa, Trường Phú", email: "lethidiemphuong74210@gmail.com" },
  { stt: 22, name: "Võ Văn Quân", dob: "02/11/2010", gender: "Nam", group: "To3", address: "Thượng Giang, Lệ Thủy", email: "voq738842@gmail.com" },
  { stt: 23, name: "Phan Thi Như Quỳnh", dob: "09/02/2010", gender: "Nữ", group: "To1", address: "Lộc An, Lệ Thủy", email: "nguyenthivanltqb3@gmail.com" },
  { stt: 24, name: "Nguyễn Trọng Oai Sang", dob: "04/02/2010", gender: "Nam", group: "To4", address: "Bang, Kim Ngân", email: "sangnguyen2k10a@gmail.com" },
  { stt: 25, name: "Châu Đình Tài", dob: "24/05/2010", gender: "Nam", group: "To1", address: "Phú Thọ, Lệ Thủy", email: "chauquang2010qb@gmail.com" },
  { stt: 26, name: "Phạm Văn Thăng", dob: "21/07/2010", gender: "Nam", group: "To1", address: "Lộc Hạ, Lệ Thủy", email: "vanthang21072010@gmail.com" },
  { stt: 27, name: "Lê Đình Thi", dob: "19/03/2010", gender: "Nam", group: "To3", address: "Thạch Bàn, Trường Phú", email: "ledinhthi1903@gmail.com" },
  { stt: 28, name: "Trần Hà Trung", dob: "18/10/2010", gender: "Nam", group: "To4", address: "Liêm Tiến, Sen Ngư", email: "hat97169@gmail.com" },
  { stt: 29, name: "Nguyễn Nhật Trung", dob: "14/11/2010", gender: "Nam", group: "To3", address: "Xuân Lai, Trường Phú", email: "mrpich1411@gmail.com" },
  { stt: 30, name: "Nguyễn Thị Cẩm Tú", dob: "21/10/2010", gender: "Nữ", group: "To4", address: "Thượng Giang, Lệ Thủy", email: "huen2466@gmail.com" },
  { stt: 31, name: "Nguyễn Thị Thảo Vy", dob: "3/4/2010", gender: "Nữ", group: "To4", address: "Xuân Giang, Lệ Thủy", email: "nguyenthithaovy2010ltqb@gmail.com" },
  { stt: 32, name: "Nguyễn Thị Hải Yến", dob: "30/05/2010", gender: "Nữ", group: "To3", address: "Văn Xá, Trường Phú", email: "haiyen3052010@gmail.com" },
  { stt: 33, name: "Ngô Thị Phi Yến", dob: "13/07/2010", gender: "Nữ", group: "To1", address: "Lộc Hạ, Lệ Thủy", email: "ngothiphiyenqb2010@gmail.com" }
];

export const TEACHER_EMAIL = "ldman87@gmail.com";
export const TEACHER_PASSWORD = "Man@0389606566";

export const SEATING_LAYOUT = [
  [1, 2, 3, 4, 5, 6, 7, 8],
  [9, 10, 11, 12, 13, 14, 15, 16],
  [17, 18, 19, 20, 21, 22, 23, 24],
  [25, 26, 27, 28, 29, 30, 31, 32],
  [33, null, null, null, null, null, null, 34]
];

export const THEME_COLOR = "#008080"; // Teal
