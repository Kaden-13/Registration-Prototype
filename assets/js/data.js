/*
 * Sample data for the Register for Classes concept prototype.
 * Course numbers follow the Weber State catalog style; sections, instructors,
 * rooms, and seat counts are invented for the prototype.
 *
 * days:   M T W R F   (R = Thursday, matching the registrar's convention)
 * start/end: minutes after midnight (null for online sections with no meeting time)
 */
window.REG_DATA = {
  terms: [
    { id: "2027SP", name: "Spring 2027", status: "open",
      note: "Registration is open for your class standing." },
    { id: "2027SU", name: "Summer 2027", status: "closed",
      note: "Registration opens March 15, 2027." },
    { id: "2026FA", name: "Fall 2026", status: "closed",
      note: "The add and drop deadline for this term has passed." }
  ],

  subjects: [
    { code: "CS", name: "Computer Science" },
    { code: "MATH", name: "Mathematics" },
    { code: "ENGL", name: "English" }
  ],

  sections: [
    { id: "CS4110-001", subject: "CS", number: "4110", section: "001",
      title: "Formal Languages and Algorithms", credits: 4,
      days: ["M", "W"], start: 540, end: 650, delivery: "In person",
      room: "Noorda 302", instructor: "R. Alvarez", capacity: 30, taken: 29 },
    { id: "CS4110-002", subject: "CS", number: "4110", section: "002",
      title: "Formal Languages and Algorithms", credits: 4,
      days: ["T", "R"], start: 810, end: 920, delivery: "In person",
      room: "Noorda 302", instructor: "R. Alvarez", capacity: 30, taken: 24 },
    { id: "CS4110-003", subject: "CS", number: "4110", section: "003",
      title: "Formal Languages and Algorithms", credits: 4,
      days: [], start: null, end: null, delivery: "Online",
      room: "Online", instructor: "K. Okafor", capacity: 30, taken: 30 },

    { id: "CS3100-001", subject: "CS", number: "3100", section: "001",
      title: "Operating Systems", credits: 4,
      days: ["M", "W"], start: 570, end: 680, delivery: "In person",
      room: "Noorda 215", instructor: "J. Whitmore", capacity: 32, taken: 18 },
    { id: "CS3100-002", subject: "CS", number: "3100", section: "002",
      title: "Operating Systems", credits: 4,
      days: [], start: null, end: null, delivery: "Online",
      room: "Online", instructor: "J. Whitmore", capacity: 35, taken: 20 },

    { id: "CS2810-001", subject: "CS", number: "2810", section: "001",
      title: "Computer Organization and Architecture", credits: 3,
      days: ["T", "R"], start: 630, end: 705, delivery: "In person",
      room: "Noorda 110", instructor: "S. Patel", capacity: 30, taken: 12 },
    { id: "CS2810-002", subject: "CS", number: "2810", section: "002",
      title: "Computer Organization and Architecture", credits: 3,
      days: ["W"], start: 1050, end: 1160, delivery: "Hybrid",
      room: "Davis D2 140", instructor: "S. Patel", capacity: 30, taken: 28 },

    { id: "CS2420-001", subject: "CS", number: "2420", section: "001",
      title: "Data Structures and Algorithms", credits: 4,
      days: ["M", "W", "F"], start: 480, end: 530, delivery: "In person",
      room: "Noorda 302", instructor: "L. Chen", capacity: 32, taken: 32 },
    { id: "CS2420-002", subject: "CS", number: "2420", section: "002",
      title: "Data Structures and Algorithms", credits: 4,
      days: ["T", "R"], start: 930, end: 1040, delivery: "In person",
      room: "Noorda 215", instructor: "L. Chen", capacity: 32, taken: 15 },

    { id: "CS3750-001", subject: "CS", number: "3750", section: "001",
      title: "Software Engineering II", credits: 4,
      days: ["M", "W"], start: 810, end: 920, delivery: "In person",
      room: "Noorda 320", instructor: "D. Brooks", capacity: 28, taken: 22 },

    { id: "MATH1210-001", subject: "MATH", number: "1210", section: "001",
      title: "Calculus I", credits: 4,
      days: ["M", "T", "W", "R"], start: 510, end: 560, delivery: "In person",
      room: "Tracy Hall 225", instructor: "A. Reyes", capacity: 40, taken: 40 },
    { id: "MATH1210-002", subject: "MATH", number: "1210", section: "002",
      title: "Calculus I", credits: 4,
      days: [], start: null, end: null, delivery: "Online",
      room: "Online", instructor: "M. Nguyen", capacity: 45, taken: 33 },
    { id: "MATH2270-001", subject: "MATH", number: "2270", section: "001",
      title: "Linear Algebra", credits: 3,
      days: ["T", "R"], start: 540, end: 615, delivery: "In person",
      room: "Tracy Hall 310", instructor: "A. Reyes", capacity: 35, taken: 20 },

    { id: "ENGL2010-001", subject: "ENGL", number: "2010", section: "001",
      title: "Intermediate Writing", credits: 3,
      days: [], start: null, end: null, delivery: "Online",
      room: "Online", instructor: "H. Lindqvist", capacity: 25, taken: 18 }
  ]
};
