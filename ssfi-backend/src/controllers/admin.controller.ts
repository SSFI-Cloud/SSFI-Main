import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { AccountStatus, UserRole } from '@prisma/client';
import { clearCache } from '../utils/cache.util';
import { emailService } from '../services/email.service';
import { generateUID } from '../services/uid.service';

export const resetAllDonations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Delete payments linked to donations first
    await prisma.payment.deleteMany({ where: { donationId: { not: null } } });
    const result = await prisma.donation.deleteMany({});

    res.status(200).json({
      status: 'success',
      data: { deletedCount: result.count, message: `${result.count} donation records deleted` },
    });
  } catch (error) {
    next(error);
  }
};

export const resetAllPayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await prisma.payment.deleteMany({});

    res.status(200).json({
      status: 'success',
      data: { deletedCount: result.count, message: `${result.count} payment records deleted` },
    });
  } catch (error) {
    next(error);
  }
};

export const resetDistrictsAndClubs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Use raw SQL throughout to bypass Prisma FK validation
    await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0`);

    // Unlink students from clubs and districts
    await prisma.$executeRawUnsafe(`UPDATE students SET clubId = NULL, districtId = NULL`);

    // Unlink event registrations from clubs and districts
    await prisma.$executeRawUnsafe(`UPDATE event_registrations SET clubId = NULL, districtId = NULL`);

    // Unlink payments from razorpay configs
    await prisma.$executeRawUnsafe(`UPDATE payments SET razorpayConfigId = NULL WHERE razorpayConfigId IS NOT NULL`);

    // Delete payments by district secretary / club owner users
    await prisma.$executeRawUnsafe(`DELETE p FROM payments p INNER JOIN users u ON p.userId = u.id WHERE u.role IN ('DISTRICT_SECRETARY', 'CLUB_OWNER')`);

    // Delete club owners
    await prisma.$executeRawUnsafe(`DELETE FROM club_owners`);

    // Delete clubs
    await prisma.$executeRawUnsafe(`DELETE FROM clubs`);

    // Delete district secretaries (registration applications)
    await prisma.$executeRawUnsafe(`DELETE FROM district_secretaries`);

    // Delete district persons (approved secretary links)
    await prisma.$executeRawUnsafe(`DELETE FROM district_persons`);

    // Delete razorpay configs for district/club users
    await prisma.$executeRawUnsafe(`DELETE rc FROM razorpay_configs rc INNER JOIN users u ON rc.userId = u.id WHERE u.role IN ('DISTRICT_SECRETARY', 'CLUB_OWNER')`);

    // Delete user accounts
    await prisma.$executeRawUnsafe(`DELETE FROM users WHERE role IN ('DISTRICT_SECRETARY', 'CLUB_OWNER')`);

    // Delete all district master records
    await prisma.$executeRawUnsafe(`DELETE FROM districts`);

    await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1`);

    clearCache();

    res.status(200).json({
      status: 'success',
      data: { message: 'All district and club data cleared. Students unlinked.' },
    });
  } catch (error: any) {
    // Re-enable FK checks on error
    try { await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1`); } catch {}
    res.status(500).json({
      status: 'error',
      message: error?.message || 'Unknown error',
      code: error?.code,
      meta: error?.meta,
    });
  }
};

export const seedDistricts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const STATES_DISTRICTS = [
      { state: "Andhra Pradesh", code: "AP", districts: ["Anantapur","Chittoor","East Godavari","Guntur","Krishna","Kurnool","Prakasam","Srikakulam","Sri Potti Sriramulu Nellore","Visakhapatnam","Vizianagaram","West Godavari","YSR District, Kadapa"] },
      { state: "Arunachal Pradesh", code: "AR", districts: ["Tawang","West Kameng","East Kameng","Papum Pare","Kurung Kumey","Kra Daadi","Lower Subansiri","Upper Subansiri","West Siang","East Siang","Siang","Upper Siang","Lower Siang","Lower Dibang Valley","Dibang Valley","Anjaw","Lohit","Namsai","Changlang","Tirap","Longding"] },
      { state: "Assam", code: "AS", districts: ["Baksa","Barpeta","Biswanath","Bongaigaon","Cachar","Charaideo","Chirang","Darrang","Dhemaji","Dhubri","Dibrugarh","Dima Hasao","Goalpara","Golaghat","Hailakandi","Hojai","Jorhat","Kamrup","Kamrup Metropolitan","Karbi Anglong","Karimganj","Kokrajhar","Lakhimpur","Majuli","Morigaon","Nagaon","Nalbari","Sivasagar","Sonitpur","South Salmara-Mankachar","Tinsukia","Udalguri","West Karbi Anglong"] },
      { state: "Bihar", code: "BR", districts: ["Araria","Arwal","Aurangabad","Banka","Begusarai","Bhagalpur","Bhojpur","Buxar","Darbhanga","East Champaran","Gaya","Gopalganj","Jamui","Jehanabad","Kaimur","Katihar","Khagaria","Kishanganj","Lakhisarai","Madhepura","Madhubani","Munger","Muzaffarpur","Nalanda","Nawada","Patna","Purnia","Rohtas","Saharsa","Samastipur","Saran","Sheikhpura","Sheohar","Sitamarhi","Siwan","Supaul","Vaishali","West Champaran"] },
      { state: "Chhattisgarh", code: "CG", districts: ["Balod","Baloda Bazar","Balrampur","Bastar","Bemetara","Bijapur","Bilaspur","Dantewada","Dhamtari","Durg","Gariaband","Janjgir-Champa","Jashpur","Kabirdham","Kanker","Kondagaon","Korba","Koriya","Mahasamund","Mungeli","Narayanpur","Raigarh","Raipur","Rajnandgaon","Sukma","Surajpur","Surguja"] },
      { state: "Goa", code: "GA", districts: ["North Goa","South Goa"] },
      { state: "Gujarat", code: "GJ", districts: ["Ahmedabad","Amreli","Anand","Aravalli","Banaskantha","Bharuch","Bhavnagar","Botad","Chhota Udaipur","Dahod","Dang","Devbhoomi Dwarka","Gandhinagar","Gir Somnath","Jamnagar","Junagadh","Kheda","Kutch","Mahisagar","Mehsana","Morbi","Narmada","Navsari","Panchmahal","Patan","Porbandar","Rajkot","Sabarkantha","Surat","Surendranagar","Tapi","Vadodara","Valsad"] },
      { state: "Haryana", code: "HR", districts: ["Ambala","Bhiwani","Charkhi Dadri","Faridabad","Fatehabad","Gurugram","Hisar","Jhajjar","Jind","Kaithal","Karnal","Kurukshetra","Mahendragarh","Nuh","Palwal","Panchkula","Panipat","Rewari","Rohtak","Sirsa","Sonipat","Yamunanagar"] },
      { state: "Himachal Pradesh", code: "HP", districts: ["Bilaspur","Chamba","Hamirpur","Kangra","Kinnaur","Kullu","Lahaul and Spiti","Mandi","Shimla","Sirmaur","Solan","Una"] },
      { state: "Jharkhand", code: "JH", districts: ["Bokaro","Chatra","Deoghar","Dhanbad","Dumka","East Singhbhum","Garhwa","Giridih","Godda","Gumla","Hazaribagh","Jamtara","Khunti","Koderma","Latehar","Lohardaga","Pakur","Palamu","Ramgarh","Ranchi","Sahibganj","Seraikela Kharsawan","Simdega","West Singhbhum"] },
      { state: "Karnataka", code: "KA", districts: ["Bagalkot","Ballari","Bangalore","Belagavi","Bidar","Chamarajanagar","Chikkaballapur","Chikkamagaluru","Chitradurga","Dakshina Kannada","Davangere","Dharwad","Gadag","Hassan","Haveri","Kalaburagi","Kodagu","Kolar","Koppal","Mandya","Mysuru","Raichur","Ramanagara","Shivamogga","Tumakuru","Udupi","Uttara Kannada","Vijayapura","Yadgir"] },
      { state: "Kerala", code: "KL", districts: ["Alappuzha","Ernakulam","Idukki","Kannur","Kasargod","Kollam","Kottayam","Kozhikode","Malappuram","Palakkad","Pathanamthitta","Thiruvananthapuram","Thrissur","Wayanad"] },
      { state: "Madhya Pradesh", code: "MP", districts: ["Agar Malwa","Alirajpur","Anuppur","Ashoknagar","Balaghat","Barwani","Betul","Bhind","Bhopal","Burhanpur","Chhatarpur","Chhindwara","Damoh","Datia","Dewas","Dhar","Dindori","Guna","Gwalior","Harda","Hoshangabad","Indore","Jabalpur","Jhabua","Katni","Khandwa","Khargone","Mandla","Mandsaur","Morena","Narsinghpur","Neemuch","Panna","Raisen","Rajgarh","Ratlam","Rewa","Sagar","Satna","Sehore","Seoni","Shahdol","Shajapur","Sheopur","Shivpuri","Sidhi","Singrauli","Tikamgarh","Ujjain","Umaria","Vidisha"] },
      { state: "Maharashtra", code: "MH", districts: ["Ahmednagar","Akola","Amravati","Aurangabad","Beed","Bhandara","Buldhana","Chandrapur","Dhule","Gadchiroli","Gondia","Hingoli","Jalgaon","Jalna","Kolhapur","Latur","Mumbai City","Mumbai Suburban","Nagpur","Nanded","Nandurbar","Nashik","Osmanabad","Palghar","Parbhani","Pune","Raigad","Ratnagiri","Sangli","Satara","Sindhudurg","Solapur","Thane","Wardha","Washim","Yavatmal"] },
      { state: "Manipur", code: "MN", districts: ["Bishnupur","Chandel","Churachandpur","Imphal East","Imphal West","Jiribam","Kakching","Kamjong","Kangpokpi","Noney","Pherzawl","Senapati","Tamenglong","Tengnoupal","Thoubal","Ukhrul"] },
      { state: "Meghalaya", code: "ML", districts: ["East Garo Hills","East Jaintia Hills","East Khasi Hills","North Garo Hills","Ri Bhoi","South Garo Hills","South West Garo Hills","South West Khasi Hills","West Garo Hills","West Jaintia Hills","West Khasi Hills"] },
      { state: "Mizoram", code: "MZ", districts: ["Aizawl","Champhai","Kolasib","Lawngtlai","Lunglei","Mamit","Saiha","Serchhip"] },
      { state: "Nagaland", code: "NL", districts: ["Dimapur","Kiphire","Kohima","Longleng","Mokokchung","Mon","Peren","Phek","Tuensang","Wokha","Zunheboto"] },
      { state: "Odisha", code: "OD", districts: ["Angul","Balangir","Balasore","Bargarh","Bhadrak","Boudh","Cuttack","Deogarh","Dhenkanal","Gajapati","Ganjam","Jagatsinghpur","Jajpur","Jharsuguda","Kalahandi","Kandhamal","Kendrapara","Kendujhar","Khordha","Koraput","Malkangiri","Mayurbhanj","Nabarangpur","Nayagarh","Nuapada","Puri","Rayagada","Sambalpur","Subarnapur","Sundargarh"] },
      { state: "Punjab", code: "PB", districts: ["Amritsar","Barnala","Bathinda","Faridkot","Fatehgarh Sahib","Fazilka","Ferozepur","Gurdaspur","Hoshiarpur","Jalandhar","Kapurthala","Ludhiana","Mansa","Moga","Muktsar","Nawanshahr","Pathankot","Patiala","Rupnagar","Sahibzada Ajit Singh Nagar","Sangrur","Tarn Taran"] },
      { state: "Rajasthan", code: "RJ", districts: ["Ajmer","Alwar","Banswara","Baran","Barmer","Bharatpur","Bhilwara","Bikaner","Bundi","Chittorgarh","Churu","Dausa","Dholpur","Dungarpur","Hanumangarh","Jaipur","Jaisalmer","Jalore","Jhalawar","Jhunjhunu","Jodhpur","Karauli","Kota","Nagaur","Pali","Pratapgarh","Rajsamand","Sawai Madhopur","Sikar","Sirohi","Sri Ganganagar","Tonk","Udaipur"] },
      { state: "Sikkim", code: "SK", districts: ["East Sikkim","North Sikkim","South Sikkim","West Sikkim"] },
      { state: "Tamil Nadu", code: "TN", districts: ["Ariyalur","Chengalpattu","Chennai","Chennai Central","Chennai North","Coimbatore","Cuddalore","Dharmapuri","Dindigul","Erode","Kallakurichi","Kanchipuram","Kanyakumari","Karur","Krishnagiri","Madurai","Mayiladuthurai","Nagapattinam","Namakkal","Nilgiris","Perambalur","Pudukkottai","Ramanathapuram","Ranipet","Salem","Sivaganga","Tenkasi","Thanjavur","Theni","Thoothukudi","Tiruchirappalli","Tirunelveli","Tirupathur","Tiruppur","Tiruvallur","Tiruvannamalai","Tiruvarur","Vellore","Viluppuram","Virudhunagar"] },
      { state: "Telangana", code: "TS", districts: ["Adilabad","Bhadradri Kothagudem","Hyderabad","Jagtial","Jangaon","Jayashankar Bhupalpally","Jogulamba Gadwal","Kamareddy","Karimnagar","Khammam","Kumuram Bheem","Mahabubabad","Mahabubnagar","Mancherial","Medak","Medchal","Nagarkurnool","Nalgonda","Nirmal","Nizamabad","Peddapalli","Rajanna Sircilla","Rangareddy","Sangareddy","Siddipet","Suryapet","Vikarabad","Wanaparthy","Warangal (Rural)","Warangal (Urban)","Yadadri Bhuvanagiri"] },
      { state: "Tripura", code: "TR", districts: ["Dhalai","Gomati","Khowai","North Tripura","Sepahijala","South Tripura","Unakoti","West Tripura"] },
      { state: "Uttar Pradesh", code: "UP", districts: ["Agra","Aligarh","Ambedkar Nagar","Amethi","Amroha","Auraiya","Ayodhya","Azamgarh","Baghpat","Bahraich","Ballia","Balrampur","Banda","Barabanki","Bareilly","Basti","Bhadohi","Bijnor","Budaun","Bulandshahr","Chandauli","Chitrakoot","Deoria","Etah","Etawah","Farrukhabad","Fatehpur","Firozabad","Gautam Buddha Nagar","Ghaziabad","Ghazipur","Gonda","Gorakhpur","Hamirpur","Hapur","Hardoi","Hathras","Jalaun","Jaunpur","Jhansi","Kannauj","Kanpur Dehat","Kanpur Nagar","Kasganj","Kaushambi","Kheri","Kushinagar","Lalitpur","Lucknow","Maharajganj","Mahoba","Mainpuri","Mathura","Mau","Meerut","Mirzapur","Moradabad","Muzaffarnagar","Pilibhit","Pratapgarh","Prayagraj","Raebareli","Rampur","Saharanpur","Sambhal","Sant Kabir Nagar","Shahjahanpur","Shamli","Shravasti","Siddharthnagar","Sitapur","Sonbhadra","Sultanpur","Unnao","Varanasi"] },
      { state: "Uttarakhand", code: "UK", districts: ["Almora","Bageshwar","Chamoli","Champawat","Dehradun","Haridwar","Nainital","Pauri Garhwal","Pithoragarh","Rudraprayag","Tehri Garhwal","Udham Singh Nagar","Uttarkashi"] },
      { state: "West Bengal", code: "WB", districts: ["Alipurduar","Bankura","Birbhum","Cooch Behar","Dakshin Dinajpur","Darjeeling","Hooghly","Howrah","Jalpaiguri","Jhargram","Kalimpong","Kolkata","Malda","Murshidabad","Nadia","North 24 Parganas","Paschim Bardhaman","Paschim Medinipur","Purba Bardhaman","Purba Medinipur","Purulia","South 24 Parganas","Uttar Dinajpur"] },
      { state: "Andaman and Nicobar Islands", code: "AN", districts: ["Nicobar","North and Middle Andaman","South Andaman"] },
      { state: "Chandigarh", code: "CH", districts: ["Chandigarh"] },
      { state: "Dadra and Nagar Haveli and Daman and Diu", code: "DN", districts: ["Dadra and Nagar Haveli","Daman","Diu"] },
      { state: "Delhi", code: "DL", districts: ["Central Delhi","East Delhi","New Delhi","North Delhi","North East Delhi","North West Delhi","Shahdara","South Delhi","South East Delhi","South West Delhi","West Delhi"] },
      { state: "Jammu and Kashmir", code: "JK", districts: ["Anantnag","Bandipora","Baramulla","Budgam","Doda","Ganderbal","Jammu","Kathua","Kishtwar","Kulgam","Kupwara","Poonch","Pulwama","Rajouri","Ramban","Reasi","Samba","Shopian","Srinagar","Udhampur"] },
      { state: "Ladakh", code: "LA", districts: ["Kargil","Leh"] },
      { state: "Lakshadweep", code: "LD", districts: ["Lakshadweep"] },
      { state: "Puducherry", code: "PY", districts: ["Karaikal","Mahe","Puducherry","Yanam"] },
    ];

    let totalDistricts = 0;
    for (const sd of STATES_DISTRICTS) {
      const state = await prisma.state.findUnique({ where: { code: sd.code } });
      if (!state) continue;
      for (const dName of sd.districts) {
        const code = dName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10);
        await prisma.district.upsert({
          where: { stateId_code: { stateId: state.id, code } },
          update: { name: dName },
          create: { name: dName, code, stateId: state.id },
        });
        totalDistricts++;
      }
    }

    // Clear location cache so new districts appear immediately
    clearCache();

    res.status(200).json({
      status: 'success',
      data: { totalDistricts, message: `${totalDistricts} districts seeded across all states` },
    });
  } catch (error) {
    next(error);
  }
};

export const flushCache = async (req: Request, res: Response, next: NextFunction) => {
  try {
    clearCache();
    res.status(200).json({
      status: 'success',
      data: { message: 'All cache cleared' },
    });
  } catch (error) {
    next(error);
  }
};

export const cleanupOrphans = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Delete district secretary records referencing non-existent districts OR states
    const dsDist = await prisma.$executeRawUnsafe(`DELETE ds FROM district_secretaries ds LEFT JOIN districts d ON ds.districtId = d.id WHERE d.id IS NULL`);
    const dsState = await prisma.$executeRawUnsafe(`DELETE ds FROM district_secretaries ds LEFT JOIN states s ON ds.stateId = s.id WHERE s.id IS NULL`);
    const ds = dsDist + dsState;
    // Delete state secretary records referencing non-existent states
    const ss = await prisma.$executeRawUnsafe(`DELETE ss FROM state_secretaries ss LEFT JOIN states s ON ss.stateId = s.id WHERE s.id IS NULL`);
    // Delete club owner records referencing non-existent clubs
    const co = await prisma.$executeRawUnsafe(`DELETE co FROM club_owners co LEFT JOIN clubs c ON co.clubId = c.id WHERE c.id IS NULL`);
    // Delete district person records referencing non-existent districts
    const dp = await prisma.$executeRawUnsafe(`DELETE dp FROM district_persons dp LEFT JOIN districts d ON dp.districtId = d.id WHERE d.id IS NULL`);
    // Delete state person records referencing non-existent states
    const sp = await prisma.$executeRawUnsafe(`DELETE sp FROM state_persons sp LEFT JOIN states s ON sp.stateId = s.id WHERE s.id IS NULL`);

    clearCache();

    res.status(200).json({
      status: 'success',
      data: { message: `Cleaned up orphaned records: ${ds} district secretaries, ${ss} state secretaries, ${co} club owners, ${dp} district persons, ${sp} state persons` },
    });
  } catch (error) {
    next(error);
  }
};

export const syncSchema = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const results: string[] = [];

    // Helper to add column if it doesn't exist
    const addColumnIfMissing = async (table: string, column: string, type: string) => {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${type}`);
        results.push(`Added ${table}.${column}`);
      } catch (e: any) {
        if (e.message?.includes('Duplicate column')) {
          results.push(`${table}.${column} already exists`);
        } else {
          results.push(`Error on ${table}.${column}: ${e.message}`);
        }
      }
    };

    // district_secretaries missing columns
    await addColumnIfMissing('district_secretaries', 'associationName', 'VARCHAR(191) NULL');
    await addColumnIfMissing('district_secretaries', 'logo', 'LONGTEXT NULL');
    await addColumnIfMissing('district_secretaries', 'associationRegistrationCopy', 'LONGTEXT NULL');
    await addColumnIfMissing('district_secretaries', 'kycVerified', 'BOOLEAN NOT NULL DEFAULT false');
    await addColumnIfMissing('district_secretaries', 'kycVerifiedAt', 'DATETIME(3) NULL');
    await addColumnIfMissing('district_secretaries', 'kycVerifiedName', 'VARCHAR(191) NULL');
    await addColumnIfMissing('district_secretaries', 'kycVerifiedDob', 'VARCHAR(191) NULL');
    await addColumnIfMissing('district_secretaries', 'kycProfileImage', 'TEXT NULL');

    // Make aadhaarNumber optional (was NOT NULL in migration)
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`district_secretaries\` MODIFY COLUMN \`aadhaarNumber\` VARCHAR(191) NULL`);
      results.push('Made district_secretaries.aadhaarNumber nullable');
    } catch (e: any) {
      results.push(`aadhaarNumber modify: ${e.message}`);
    }

    // Make identityProof optional
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`district_secretaries\` MODIFY COLUMN \`identityProof\` VARCHAR(191) NULL`);
      results.push('Made district_secretaries.identityProof nullable');
    } catch (e: any) {
      results.push(`identityProof modify: ${e.message}`);
    }

    // state_secretaries missing columns
    await addColumnIfMissing('state_secretaries', 'associationName', 'VARCHAR(191) NULL');

    // registration_windows missing columns
    await addColumnIfMissing('registration_windows', 'renewalEnabled', 'BOOLEAN NOT NULL DEFAULT false');

    // Fix: set otpVerified=true for all approved users (they were created without it)
    try {
      const fixed = await prisma.$executeRawUnsafe(
        `UPDATE users SET otpVerified = true WHERE isApproved = true AND otpVerified = false`
      );
      if (fixed) results.push(`Fixed otpVerified for ${fixed} approved users`);
    } catch (e: any) {
      results.push(`otpVerified fix: ${e.message}`);
    }

    // Fix: approve users who have approved secretary records but unapproved user accounts
    try {
      const fixedDS = await prisma.$executeRawUnsafe(
        `UPDATE users u
         INNER JOIN district_secretaries ds ON (u.phone = ds.phone OR u.email = ds.email)
         SET u.isApproved = true, u.isActive = true, u.otpVerified = true, u.approvalStatus = 'APPROVED'
         WHERE ds.status = 'APPROVED' AND (u.isApproved = false OR u.isActive = false)`
      );
      if (fixedDS) results.push(`Fixed ${fixedDS} users with approved district secretary records`);

      const fixedSS = await prisma.$executeRawUnsafe(
        `UPDATE users u
         INNER JOIN state_secretaries ss ON (u.phone = ss.phone OR u.email = ss.email)
         SET u.isApproved = true, u.isActive = true, u.otpVerified = true, u.approvalStatus = 'APPROVED'
         WHERE ss.status = 'APPROVED' AND (u.isApproved = false OR u.isActive = false)`
      );
      if (fixedSS) results.push(`Fixed ${fixedSS} users with approved state secretary records`);
    } catch (e: any) {
      results.push(`Secretary user approval fix: ${e.message}`);
    }

    // Fix: Create missing districtPerson records for approved district secretaries
    try {
      const missingDP = await prisma.$queryRawUnsafe(`
        SELECT ds.districtId, ds.name, ds.gender, ds.residentialAddress, ds.email, ds.phone, u.id as userId
        FROM district_secretaries ds
        INNER JOIN users u ON (u.phone = ds.phone OR u.email = ds.email)
        WHERE ds.status = 'APPROVED'
        AND u.role = 'DISTRICT_SECRETARY'
        AND ds.districtId NOT IN (SELECT districtId FROM district_persons)
        GROUP BY ds.districtId
      `) as any[];
      let dpCreated = 0;
      for (const row of missingDP) {
        try {
          await prisma.districtPerson.create({
            data: {
              userId: row.userId,
              districtId: row.districtId,
              name: row.name,
              gender: row.gender || 'MALE',
              aadhaarNumber: `SYNC-${Date.now()}-${row.districtId}`,
              addressLine1: row.residentialAddress || 'N/A',
              city: 'N/A',
              pincode: '000000',
              identityProof: 'sync-created',
            },
          });
          dpCreated++;
        } catch (e: any) {
          // Skip duplicates
        }
      }
      if (dpCreated) results.push(`Created ${dpCreated} missing districtPerson records`);

      // Same for state persons
      const missingSP = await prisma.$queryRawUnsafe(`
        SELECT ss.stateId, ss.name, ss.gender, ss.residentialAddress, ss.email, ss.phone, u.id as userId
        FROM state_secretaries ss
        INNER JOIN users u ON (u.phone = ss.phone OR u.email = ss.email)
        WHERE ss.status = 'APPROVED'
        AND u.role = 'STATE_SECRETARY'
        AND ss.stateId NOT IN (SELECT stateId FROM state_persons)
        GROUP BY ss.stateId
      `) as any[];
      let spCreated = 0;
      for (const row of missingSP) {
        try {
          await prisma.statePerson.create({
            data: {
              userId: row.userId,
              stateId: row.stateId,
              name: row.name,
              gender: row.gender || 'MALE',
              aadhaarNumber: `SYNC-${Date.now()}-${row.stateId}`,
              addressLine1: row.residentialAddress || 'N/A',
              city: 'N/A',
              pincode: '000000',
              identityProof: 'sync-created',
            },
          });
          spCreated++;
        } catch (e: any) {
          // Skip duplicates
        }
      }
      if (spCreated) results.push(`Created ${spCreated} missing statePerson records`);
    } catch (e: any) {
      results.push(`Person record fix: ${e.message}`);
    }

    // Fix: Regenerate UIDs that don't follow SSFI format
    try {
      // Fix district secretary UIDs (User table) — should be SSFI/{StateCode}/{DistrictCode}/D####
      const dsBadUids = await prisma.user.findMany({
        where: {
          role: 'DISTRICT_SECRETARY',
          NOT: { uid: { startsWith: 'SSFI/' } },
        },
        select: { id: true, uid: true },
        orderBy: { createdAt: 'asc' },
      });
      let dsUidFixed = 0;
      for (const u of dsBadUids) {
        // Find districtPerson to get districtId and stateId
        const dp = await prisma.districtPerson.findFirst({ where: { userId: u.id }, include: { district: true } });
        if (dp?.districtId && dp.district?.stateId) {
          const newUid = await generateUID('DISTRICT_SECRETARY', { stateId: dp.district.stateId, districtId: dp.districtId });
          await prisma.user.update({ where: { id: u.id }, data: { uid: newUid } });
          // Also update the districtSecretary record if it exists
          const ds = await prisma.districtSecretary.findFirst({ where: { districtId: dp.districtId, status: 'APPROVED' }, orderBy: { createdAt: 'desc' } });
          if (ds) {
            if (!ds.uid.startsWith('SSFI/')) {
              await prisma.districtSecretary.update({ where: { id: ds.id }, data: { uid: newUid } });
            }
            // Also set proper expiry (1 year from approval date) for this approved secretary
            const newExpiry = new Date(ds.approvedAt || ds.createdAt);
            newExpiry.setFullYear(newExpiry.getFullYear() + 1);
            await prisma.user.update({
              where: { id: u.id },
              data: {
                expiryDate: newExpiry,
                registrationDate: ds.approvedAt || ds.createdAt,
                lastRenewalDate: ds.approvedAt || ds.createdAt,
                accountStatus: newExpiry > new Date() ? 'ACTIVE' : 'EXPIRED',
                isApproved: true,
                isActive: true,
              },
            });
          }
          dsUidFixed++;
        }
      }
      if (dsUidFixed) results.push(`Fixed ${dsUidFixed} district secretary UIDs to SSFI format`);

      // Fix state secretary UIDs
      const ssBadUids = await prisma.user.findMany({
        where: {
          role: 'STATE_SECRETARY',
          NOT: { uid: { startsWith: 'SSFI/' } },
        },
        select: { id: true, uid: true },
        orderBy: { createdAt: 'asc' },
      });
      let ssUidFixed = 0;
      for (const u of ssBadUids) {
        const sp = await prisma.statePerson.findFirst({ where: { userId: u.id } });
        if (sp?.stateId) {
          const newUid = await generateUID('STATE_SECRETARY', { stateId: sp.stateId });
          await prisma.user.update({ where: { id: u.id }, data: { uid: newUid } });
          const ss = await prisma.stateSecretary.findFirst({ where: { stateId: sp.stateId, status: 'APPROVED' }, orderBy: { createdAt: 'desc' } });
          if (ss) {
            if (!ss.uid.startsWith('SSFI/')) {
              await prisma.stateSecretary.update({ where: { id: ss.id }, data: { uid: newUid } });
            }
            const newExpiry = new Date(ss.approvedAt || ss.createdAt);
            newExpiry.setFullYear(newExpiry.getFullYear() + 1);
            await prisma.user.update({
              where: { id: u.id },
              data: {
                expiryDate: newExpiry,
                registrationDate: ss.approvedAt || ss.createdAt,
                lastRenewalDate: ss.approvedAt || ss.createdAt,
                accountStatus: newExpiry > new Date() ? 'ACTIVE' : 'EXPIRED',
                isApproved: true,
                isActive: true,
              },
            });
          }
          ssUidFixed++;
        }
      }
      if (ssUidFixed) results.push(`Fixed ${ssUidFixed} state secretary UIDs to SSFI format`);

      // Fix club UIDs
      const clubsBadUids = await prisma.club.findMany({
        where: { NOT: { uid: { startsWith: 'SSFI/' } } },
        select: { id: true, uid: true, districtId: true, stateId: true },
        orderBy: { createdAt: 'asc' },
      });
      let clubUidFixed = 0;
      for (const c of clubsBadUids) {
        if (c.districtId && c.stateId) {
          const newUid = await generateUID('CLUB', { stateId: c.stateId, districtId: c.districtId });
          await prisma.club.update({ where: { id: c.id }, data: { uid: newUid } });
          clubUidFixed++;
        }
      }
      if (clubUidFixed) results.push(`Fixed ${clubUidFixed} club UIDs to SSFI format`);
    } catch (e: any) {
      results.push(`UID fix: ${e.message}`);
    }

    // Fix: Sync secretary user accounts with their secretary records (phone, email, password)
    try {
      // State secretaries: match user via statePerson → stateSecretary
      const statePersons = await prisma.statePerson.findMany({
        include: {
          user: { select: { id: true, phone: true, email: true } },
          state: {
            include: {
              stateSecretaries: {
                where: { status: 'APPROVED' },
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
        },
      });
      let secSynced = 0;
      for (const sp of statePersons) {
        const ss = sp.state?.stateSecretaries?.[0];
        if (ss && sp.user) {
          const updates: any = {};
          if (sp.user.phone !== ss.phone) updates.phone = ss.phone;
          if (sp.user.email !== ss.email) updates.email = ss.email;
          if (Object.keys(updates).length > 0) {
            updates.password = await bcrypt.hash(ss.phone, 12);
            await prisma.user.update({ where: { id: sp.user.id }, data: updates });
            secSynced++;
          }
        }
      }

      // District secretaries: match user via districtPerson → districtSecretary
      const districtPersons = await prisma.districtPerson.findMany({
        include: {
          user: { select: { id: true, phone: true, email: true } },
          district: {
            include: {
              districtSecretaries: {
                where: { status: 'APPROVED' },
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
        },
      });
      for (const dp of districtPersons) {
        const ds = dp.district?.districtSecretaries?.[0];
        if (ds && dp.user) {
          const updates: any = {};
          if (dp.user.phone !== ds.phone) updates.phone = ds.phone;
          if (dp.user.email !== ds.email) updates.email = ds.email;
          if (Object.keys(updates).length > 0) {
            updates.password = await bcrypt.hash(ds.phone, 12);
            await prisma.user.update({ where: { id: dp.user.id }, data: updates });
            secSynced++;
          }
        }
      }
      if (secSynced) results.push(`Synced ${secSynced} secretary user accounts (phone/email/password)`);
    } catch (e: any) {
      results.push(`Secretary sync fix: ${e.message}`);
    }

    // Fix: Hash plain-text passwords (created by old approval flow)
    try {
      const usersWithBadPw = await prisma.user.findMany({
        where: {
          NOT: { password: { startsWith: '$2' } },
        },
        select: { id: true, phone: true, password: true },
      });
      let pwFixed = 0;
      for (const u of usersWithBadPw) {
        const hashed = await bcrypt.hash(u.phone, 12);
        await prisma.user.update({ where: { id: u.id }, data: { password: hashed } });
        pwFixed++;
      }
      if (pwFixed) results.push(`Fixed ${pwFixed} users with unhashed passwords`);
    } catch (e: any) {
      results.push(`Password hash fix: ${e.message}`);
    }

    res.status(200).json({
      status: 'success',
      data: { results },
    });
  } catch (error) {
    next(error);
  }
};

export const cleanupTestData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted: string[] = [];

    // Delete state secretaries with placeholder emails
    const ss = await prisma.$executeRawUnsafe(
      `DELETE FROM state_secretaries WHERE email LIKE '%@ssfi.placeholder'`
    );
    if (ss) deleted.push(`${ss} placeholder state secretaries`);

    // Delete state persons linked to placeholder users
    const sp = await prisma.$executeRawUnsafe(
      `DELETE sp FROM state_persons sp INNER JOIN users u ON sp.userId = u.id WHERE u.email LIKE '%@ssfi.placeholder'`
    );
    if (sp) deleted.push(`${sp} placeholder state persons`);

    // Delete district secretaries with placeholder emails
    const ds = await prisma.$executeRawUnsafe(
      `DELETE FROM district_secretaries WHERE email LIKE '%@ssfi.placeholder'`
    );
    if (ds) deleted.push(`${ds} placeholder district secretaries`);

    // Delete district persons linked to placeholder users
    const dp = await prisma.$executeRawUnsafe(
      `DELETE dp FROM district_persons dp INNER JOIN users u ON dp.userId = u.id WHERE u.email LIKE '%@ssfi.placeholder'`
    );
    if (dp) deleted.push(`${dp} placeholder district persons`);

    // Delete placeholder users themselves
    const u = await prisma.$executeRawUnsafe(
      `DELETE FROM users WHERE email LIKE '%@ssfi.placeholder'`
    );
    if (u) deleted.push(`${u} placeholder users`);

    clearCache();

    res.status(200).json({
      status: 'success',
      data: { message: deleted.length > 0 ? `Cleaned: ${deleted.join(', ')}` : 'No placeholder data found' },
    });
  } catch (error) {
    next(error);
  }
};

export const bulkExpireStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await prisma.user.updateMany({
      where: {
        role: UserRole.STUDENT,
        accountStatus: AccountStatus.ACTIVE,
      },
      data: {
        accountStatus: AccountStatus.EXPIRED,
        expiryDate: new Date(),
      },
    });

    res.status(200).json({
      status: 'success',
      data: { updatedCount: result.count, message: `${result.count} student accounts marked as expired` },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Extend/activate a user's membership by UID or user ID
 * POST /api/v1/admin/extend-membership
 * Body: { uid: string, months?: number }  (defaults to 12 months)
 */
export const extendMembership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { uid, userId, months = 12 } = req.body;

    if (!uid && !userId) {
      return res.status(400).json({ success: false, message: 'Provide uid or userId' });
    }

    const where = uid ? { uid: uid as string } : { id: Number(userId) };
    const user = await prisma.user.findFirst({ where });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newExpiry = new Date();
    newExpiry.setMonth(newExpiry.getMonth() + Number(months));

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        accountStatus: AccountStatus.ACTIVE,
        expiryDate: newExpiry,
        isActive: true,
      },
    });

    clearCache();

    res.status(200).json({
      status: 'success',
      data: {
        uid: updated.uid,
        role: updated.role,
        accountStatus: updated.accountStatus,
        expiryDate: updated.expiryDate,
        message: `Membership extended to ${newExpiry.toLocaleDateString('en-IN')}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend login credentials to a user via email
 * POST /admin/resend-credentials
 * Body: { userId?: number, uid?: string, email?: string, phone?: string }
 * Finds user by any of these identifiers and resends their login credentials
 */
export const resendCredentials = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, uid, email, phone } = req.body;

    if (!userId && !uid && !email && !phone) {
      return res.status(400).json({ status: 'error', message: 'Provide userId, uid, email, or phone to identify the user' });
    }

    // Find the user
    const user = await prisma.user.findFirst({
      where: {
        ...(userId && { id: Number(userId) }),
        ...(uid && { uid }),
        ...(email && { email }),
        ...(phone && { phone }),
      },
      include: {
        statePerson: { select: { name: true, stateId: true } },
        districtPerson: { select: { name: true, districtId: true } },
        clubOwner: { select: { name: true, clubId: true } },
        student: { select: { name: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    // Get the user's display name from the appropriate person record
    const name = user.statePerson?.name
      || user.districtPerson?.name
      || user.clubOwner?.name
      || user.student?.name
      || 'User';

    // Reset password to phone number (hashed) and send credentials
    const defaultPassword = user.phone;
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } });

    const recipientEmail = user.email;
    if (!recipientEmail) {
      return res.status(400).json({ status: 'error', message: 'User does not have an email address on file' });
    }

    // Send credentials email
    await emailService.sendCredentials(recipientEmail, name, {
      uid: user.uid,
      password: defaultPassword,
      role: user.role,
    });

    res.status(200).json({
      status: 'success',
      data: {
        message: `Login credentials sent to ${recipientEmail}`,
        uid: user.uid,
        email: recipientEmail,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};
