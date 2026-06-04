import { parseSMSWithRegex } from './ai.js';

const testCases = [
  {
    name: "Uzcard Format Test",
    sms: "Uzcard. Savdo: Korzinka 50000 UZS. Qoldiq: 4500000 UZS",
    expectedAmount: 50000,
    expectedMerchant: "Korzinka",
    expectedCategory: "🛒 Oziq-ovqat"
  },
  {
    name: "Humo Format Test",
    sms: "HUMO. To'lov: Yandex Go 15000 UZS. Balans: 120000 UZS",
    expectedAmount: 15000,
    expectedMerchant: "Yandex Go",
    expectedCategory: "🚗 Transport"
  },
  {
    name: "Kapitalbank Format Test",
    sms: "620000 UZS Bolt uchun to'landi",
    expectedAmount: 620000,
    expectedMerchant: "Bolt",
    expectedCategory: "🚗 Transport"
  }
];

console.log("=== HAMYON AI: SMS PARSER TESTLARINI BOSHLASH ===\n");

let passedCount = 0;

testCases.forEach((tc, idx) => {
  console.log(`[Test ${idx + 1}] ${tc.name}:`);
  console.log(`💬 Xabar: "${tc.sms}"`);
  
  const result = parseSMSWithRegex(tc.sms);
  
  if (result) {
    console.log(`✅ Natija:`, JSON.stringify(result, null, 2));
    
    const amountMatch = result.amount === tc.expectedAmount;
    const merchantMatch = result.merchant.toLowerCase() === tc.expectedMerchant.toLowerCase();
    const categoryMatch = result.category === tc.expectedCategory;
    
    if (amountMatch && merchantMatch && categoryMatch) {
      console.log("🟢 HOLATI: MUVAFFAQIYATLI (PASS)\n");
      passedCount++;
    } else {
      console.log("🔴 HOLATI: XATOLIK (FAIL)");
      if (!amountMatch) console.log(`   - Kutilgan summa: ${tc.expectedAmount}, Olingan: ${result.amount}`);
      if (!merchantMatch) console.log(`   - Kutilgan do'kon: ${tc.expectedMerchant}, Olingan: ${result.merchant}`);
      if (!categoryMatch) console.log(`   - Kutilgan toifa: ${tc.expectedCategory}, Olingan: ${result.category}`);
      console.log();
    }
  } else {
    console.log("🔴 HOLATI: XATOLIK (SMS o'qilmadi)\n");
  }
});

console.log(`=== TEST YAKUNI: ${passedCount}/${testCases.length} TASI MUVAFFAQIYATLI O'TDI ===`);
