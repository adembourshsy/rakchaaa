const fs = require('fs');

let content = fs.readFileSync('src/components/modals/GameModeModal.tsx', 'utf8');

content = content.replace(/\{isEditMode \? \(language === 'ar' \? 'تعديل النمط' : 'Edit Mode'\) : \(language === 'ar' \? 'اختيار النمط' : 'Mode Setup'\)\}/g, "{isEditMode ? (t('editMode') || 'Edit Mode') : (t('modeSetup') || 'Mode Setup')}");
content = content.replace(/\{language === 'ar' \? 'إغلاق' : 'Dismiss'\}/g, "{t('dismiss') || 'Dismiss'}");
content = content.replace(/\{language === 'ar' \? 'لعبة مجانية • 0 كوينز' : 'Free Game • 0 Coins'\}/g, "{t('freeGameZeroCoins') || 'Free Game • 0 Coins'}");
content = content.replace(/\{language === 'ar' \? 'بدون رسوم دخول' : 'No coin entry fee'\}/g, "{t('noCoinEntryFee') || 'No coin entry fee'}");
content = content.replace(/\{language === 'ar' \? 'تأكيد الفئة العمرية \(\+18\)' : '18\+ Age Verification'\}/g, "{t('ageVerification') || '18+ Age Verification'}");
content = content.replace(/\{language === 'ar'\s*\n\s*\? 'يجب أن يكون عمرك 18 عامًا أو أكثر للعب هذا النمط\.'\s*\n\s*: 'You must be 18 years or older to play this mode\.'\}/g, "{t('ageMustBe18') || 'You must be 18 years or older to play this mode.'}");
content = content.replace(/\{language === 'ar' \? 'رجوع' : 'Back'\}/g, "{t('back') || 'Back'}");
content = content.replace(/\{language === 'ar' \? 'موافق • ابدأ' : 'Confirm & Start'\}/g, "{t('confirmAndStart') || 'Confirm & Start'}");

fs.writeFileSync('src/components/modals/GameModeModal.tsx', content);
