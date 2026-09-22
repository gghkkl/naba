# حزمة توقيع تطبيق NABA على iPhone

هذه الحزمة تحتوي على مشروع iOS Native كامل باسم `NABA`، وليس ملف IPA موقّعاً.
بيئة Replit/Linux لا تحتوي على Xcode، لذلك يتم إنشاء IPA النهائي على جهاز Mac الذي
سيستخدم شهادة Apple الخاصة بك.

## على جهاز Mac

1. فك ضغط الحزمة وافتح مجلد المشروع في Terminal.
2. ثبّت Node.js وpnpm، ثم شغّل:

   ```bash
   pnpm install
   cd ios
   pod install
   open NABA.xcworkspace
   ```

3. في Xcode اختر مشروع `NABA` ثم `Signing & Capabilities`.
4. اختر Apple Team الخاص بك، واجعل Bundle Identifier فريداً إذا طلب Xcode ذلك.
5. اختر iPhone المتصل من قائمة الأجهزة، ثم شغّل التطبيق أو استخدم:
   `Product > Archive > Distribute App`.

## إنشاء IPA مجانية من ويندوز عبر Codemagic

يمكن استخدام Codemagic لبناء IPA غير موقّعة على جهاز macOS سحابي، ثم تنزيلها
وتوقيعها في ويندوز عبر Sideloadly أو AltStore:

1. أنشئ حساباً مجانياً في Codemagic.
2. ارفع محتويات هذه الحزمة إلى مستودع GitHub خاص.
3. اربط المستودع بحساب Codemagic واختر workflow باسم `NABA iOS unsigned IPA`.
4. اضغط Start new build.
5. نزّل artifact باسم `NABA-unsigned.ipa`.
6. افتح الملف في Sideloadly على ويندوز وأكمل التوقيع بحساب Apple.

ملفا `codemagic.yaml` و`scripts/build-unsigned-ipa.sh` يجهزان البناء
تلقائياً بدون شهادة Apple. الحساب الشخصي المجاني في Codemagic يتضمن 500 دقيقة
macOS شهرياً؛ لا تفعل الدفع الإضافي إذا كنت تريد البقاء ضمن المجاني.

## البديل المجاني عبر GitHub Actions

تحتوي الحزمة أيضاً على `.github/workflows/build-ios-unsigned.yml`. بعد رفع
المحتويات إلى GitHub:

1. افتح تبويب **Actions**.
2. اختر **Build NABA unsigned IPA**.
3. اضغط **Run workflow**.
4. بعد انتهاء العملية افتح **Artifacts** ونزّل `NABA-unsigned-IPA`.

لا تضع Apple ID أو كلمة المرور أو أي شهادة في GitHub لهذا البناء؛ التوقيع يتم
لاحقاً في Sideloadly على جهازك.

## ما تم تضمينه

- شعار NABA الحالي المستخدم في `app.json` و`AppIcon`.
- أغلفة الكتب محلياً، لذلك تظهر مباشرة دون انتظار Internet Archive.
- مسارات الرئيسية، المكتبة، تفاصيل الكتاب، القارئ، البحث والتنزيلات.
- صفحات كتاب «أولئك الثلاثة والعشرون فتىً» محلياً.
- تنزيل كتاب «سلامٌ على إبراهيم» للقراءة دون اتصال، مع حفظ تقدّم القراءة.

## ملاحظة عن القارئ

تم التحقق من إنشاء iOS production bundle وAndroid production bundle ومن سلامة
TypeScript. التوقيع والتثبيت الفعليان على iPhone يحتاجان Mac وXcode وحساب Apple؛
لا يمكن التحقق منهما داخل Linux.