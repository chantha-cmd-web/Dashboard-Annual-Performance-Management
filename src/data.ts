import { Employee, Criteria, SystemUser } from "./types";

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: '230452', name: 'RIN NARITH', nameKh: 'រិន ណារិទ្ធ', hired: '18-SEP-2023', gender: 'M', campus: 'BKK', position: 'SCHOOL PRINCIPAL' },
  { id: '9155', name: 'NIL VEASNA', nameKh: 'និល វាសនា', hired: '1-MAR-2017', gender: 'M', campus: 'BTB3', position: 'SCHOOL PRINCIPAL' },
  { id: '15134', name: 'LY DEUC KHANG', nameKh: 'លី ដឹកខាំង', hired: '16-JUL-2018', gender: 'M', campus: 'CKD', position: 'SCHOOL PRINCIPAL' },
  { id: '250028', name: 'CHHOEUNG SENGHENG', nameKh: 'ឆឹង សេងហេង', hired: '24-MAR-2025', gender: 'M', campus: 'BCH', position: 'SCHOOL PRINCIPAL' },
  { id: '211949', name: 'MENG SENGHAK', nameKh: 'ម៉េង សេងហាក់', hired: '1-MAR-2021', gender: 'M', campus: 'DNG', position: 'SCHOOL PRINCIPAL' },
  { id: '212076', name: 'KANN LORN', nameKh: 'កាន់ ឡន', hired: '1-DEC-2021', gender: 'M', campus: 'SSK', position: 'SCHOOL PRINCIPAL' },
  { id: '230510', name: 'PRAK PHALLA', nameKh: 'ប្រាក់ ផល្លា', hired: '2-JAN-2024', gender: 'M', campus: 'CAR', position: 'SCHOOL PRINCIPAL' },
  { id: '240010', name: 'LEK SIN RITHY', nameKh: 'ឡឹក ស៊ីនរឹទ្ធី', hired: '5-FEB-2024', gender: 'M', campus: 'SHV', position: 'SCHOOL PRINCIPAL' },
  { id: '11249', name: 'PRAK BORETH', nameKh: 'ប្រាក់ បូរេត', hired: '16-OCT-2018', gender: 'M', campus: 'STD', position: 'SCHOOL PRINCIPAL' },
  { id: '230509', name: 'IM CHANLY', nameKh: 'អ៊ឹម ចាន់លី', hired: '2-JAN-2024', gender: 'M', campus: 'TSK', position: 'SCHOOL PRINCIPAL' },
  { id: '230326', name: 'SHUN RAMO', nameKh: 'ស៊ុន រ៉ាម៉ូ', hired: '3-JUL-2023', gender: 'M', campus: 'VSB', position: 'SCHOOL PRINCIPAL' },
  { id: '3002', name: 'CHAN BUNNY', nameKh: 'ចាន់ ប៊ុននី', hired: '1-AUG-2006', gender: 'M', campus: 'OPERATIONS', position: 'BUSINESS DEVELOPMENT/PROCUREMENT MANAGER' }
];

export const CRITERIA: Criteria[] = [
  { id: 1, kh: 'អាកប្បកិរិយា', khDesc: '(វាយតម្លៃចំណាប់អារម្មណ៍ និងភាពសាទរ របស់បុគ្គលិកដែលបង្ហាញចំពោះការងារ និង កិច្ចខិតខំប្រឹងប្រែងប្រកបដោយនិរន្តរភាព)', en: 'Attitude', desc: 'Evaluating the enthusiasm and dedication of employees demonstrated towards their work, as well as their continuous effort and perseverance' },
  { id: 2, kh: 'ចំណេះដឹងការងារ', khDesc: '(វាយតម្លៃការយល់ដឹងអំពីការងារ និងកម្រិតជំនាញ ដែលកំពុងបំពេញ ការងាររាល់ថ្ងៃ)', en: 'Job Knowledge', desc: 'Evaluating understanding of work and skill level in daily job performance' },
  { id: 3, kh: 'គំនិតផ្តួចផ្តើម', khDesc: '(វាយតម្លៃទៅលើ គំនិតផ្តួចផ្ដើមក្នុងការអភិវឌ្ឍន៍ក្នុងផ្នែក និង វិធីសាស្ត្រផ្សេងៗ ក្នុងការដោះស្រាយបញ្ហាជាដើម)', en: 'Initiative', desc: 'Evaluating proactive thinking in department development, problem-solving methods, and other innovative approaches' },
  { id: 4, kh: 'ការវិនិច្ឆ័យ និងការយល់ដឹង', khDesc: '(វាយតម្លៃការយល់ដឹងពីការដោះស្រាយបញ្ហា ការសម្រេចចិត្ត និងការយល់ដឹងពី របៀបក្នុងការទប់ស្កាត់បញ្ហាដែលកើតឡើងក្នុងផ្នែក)', en: 'Judgment and Awareness', desc: 'Evaluating problem-solving skills, decision-making abilities, and understanding of preventive measures within the department' },
  { id: 5, kh: 'ការអភិវឌ្ឍន៍បុគ្គលិក', khDesc: '(វាយតម្លៃប្រសិទ្ធភាពនៃការកសាងសមត្ថភាពបុគ្គលិកពីការបង្វឹក ការណែនាំ ការចាត់តាំងការងារដែលស្ថិតក្នុងការគ្រប់គ្រងរបស់ខ្លួន)', en: 'Employee Development', desc: 'Evaluating the effectiveness of capacity building through training, guidance, and task delegation' },
  { id: 6, kh: 'ការចូលរួមក្នុងការគ្រប់គ្រង់ផ្នែក', khDesc: '(វាយតម្លៃការអនុលោមតាមទិសដៅការងារ/ការណែនាំ/ នីតិវិធី/ការចូលផ្តួចផ្ដើមគំនិត ក្នុងការអភិវឌ្ឍន៍ក្នុងផ្នែក)', en: 'Participation in Department Management', desc: 'Evaluating adherence to work directives, guidelines, procedures, and contributions of innovative ideas for department development' },
  { id: 7, kh: 'វិន័យបុគ្គលិក', khDesc: '(វាយតម្លៃលើការគោរពវិន័យរបស់បុគ្គលិក គោរពតាមការណែនាំរបស់និងគោការណ៍ នានារបស់សាលា)', en: 'Employee Discipline', desc: 'Evaluating employees\' adherence to discipline, compliance with guidelines, and respect for school regulations' },
  { id: 8, kh: 'ការ​ទំនាក់ទំនង', khDesc: '(វាយតម្លៃលើការទំនាក់ទំនងរបស់បុគ្គលិកជាមួយមិត្តរួមការងារក្នុងផ្នែក និងក្នុង ស្ថាប័នទាំងមូល)', en: 'Communication', desc: 'Evaluating employees\' interactions with colleagues within the department and across the institution' },
  { id: 9, kh: 'ភាពជាអ្នកដឹកនាំ', khDesc: '(វាយតម្លៃ លើភាពនៃភាពជាអ្នកដឹកនាំ ការកសាងក្រុម និងការវិនិច្ឆ័យទាក់ទងនឹងការអនុវត្តការងារដោយមានប្រសិទ្ធភាពខ្ពស់)', en: 'Leadership', desc: 'Evaluating leadership qualities, team building, and decision-making related to the effective implementation of work' },
  { id: 10, kh: 'ការប្រើប្រាស់ប្រព័ន្ធបច្ចេកវិទ្យា', khDesc: '(វាយតម្លៃទៅលើជំនាញក្នុងការប្រើប្រាស់បច្ចេកវិទ្យាសម្រាប់ការងារការិយាល័យ និងកម្មវិធីចំបាច់មួយចំនួនដូចជា Excel, Google Sheet, Email, Ai ឬ កម្មវិធីផ្សេងៗ)', en: 'Technology Use', desc: 'Proficiency in using office technology and systems required for the role e.g., Microsoft (Word, Excel), Google sheet, email, Ai tools, or other programs' }
];

export const INITIAL_USERS: SystemUser[] = [
  { id: '201760', name: 'LAV SREY NET', password: 'admin123', role: 'admin' },
  { id: '13177', name: 'IN SOPHOAN', password: 'admin123', role: 'admin' },
  { id: '201578', name: 'KING ROTH MONY', password: 'admin123', role: 'admin' },
  { id: '1005', name: 'KAO VANNAK', password: 'admin123', role: 'admin' },
  { id: '1006', name: 'HOU PHALKUN', password: 'admin123', role: 'admin' },
  { id: '1019', name: 'VUN SOPHATH', password: 'admin123', role: 'admin' },
  { id: '2002', name: 'TINA MARIE ESTIOKO', password: 'admin123', role: 'admin' },
  { id: '201580', name: 'CHAN THEA', password: 'admin123', role: 'admin' },
  { id: '240256', name: 'CHAN SAMBATH', password: 'admin123', role: 'admin' },
  { id: '201674', name: 'LY BUNTHOEUN', password: 'admin123', role: 'admin' }
];

export const SUPER_ADMIN: SystemUser = {
  id: 'superadmin',
  name: 'Super Administrator',
  password: 'super@2024',
  role: 'superadmin'
};
