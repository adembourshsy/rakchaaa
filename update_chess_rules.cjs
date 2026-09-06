const fs = require('fs');
let content = fs.readFileSync('src/components/views/WaitingRoomView.tsx', 'utf8');

const target = `            </div>
          );
        })()
      ) : joinedRoom.gameId === 'belote' ? (`;

const replacement = `            </div>
          );
        })()
      ) : joinedRoom.gameId === 'chess' ? (
        (() => {
          const btnView = t('viewRulesBtn');
          const btnClose = t('closeRulesBtn');
          
          return (
            <div className="w-full rounded-2xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#989277]/30 dark:border-[#B8B5A5]/20 overflow-hidden shadow-xs transition-all" dir="rtl">
              <button
                onClick={() => setShowChessRules(!showChessRules)}
                className="w-full p-4 flex items-center justify-between hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all text-right"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-500">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-mono font-bold text-[#040403] dark:text-[#F8F7E8] uppercase">
                      قوانين الشطرنج
                    </p>
                    <p className="text-[10px] text-[#989277] dark:text-[#B8B5A5]">
                      تعرف على القواعد الأساسية، حركة القطع وقوانين التبييت والأسر بالتجاوز.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-indigo-500 font-bold">
                  {showChessRules ? btnClose : btnView}
                </span>
              </button>

              <AnimatePresence>
                {showChessRules && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="border-t border-[#989277]/15 dark:border-[#B8B5A5]/10 p-4 bg-[#EDF0C2]/30 dark:bg-[#11110F]/60"
                  >
                    <div className="space-y-3 font-mono text-xs text-[#040403] dark:text-[#F8F7E8]">
                      
                      {/* Basic Rules */}
                      <div className="p-3 rounded-xl bg-white dark:bg-[#11110F] border border-[#989277]/10 space-y-1">
                        <span className="block text-[9px] font-mono text-indigo-500 uppercase font-bold">الهدف الأساسي</span>
                        <p className="text-xs text-[#525866] dark:text-[#B8B5A5]">
                          الهدف هو "كش مات" لملك الخصم، أي وضعه تحت التهديد بحيث لا يمكنه الهروب أو الحماية.
                        </p>
                      </div>

                      {/* Movement */}
                      <div className="p-3 rounded-xl bg-white dark:bg-[#11110F] border border-[#989277]/10 space-y-2">
                        <span className="block text-[9px] font-mono text-indigo-500 uppercase font-bold">حركة القطع</span>
                        <div className="space-y-2 font-sans text-[11px]">
                          <div className="pb-1 flex justify-between gap-1 border-b border-[#989277]/5 text-right">
                            <span className="font-mono font-bold text-indigo-500 shrink-0">البيدق</span>
                            <span className="text-[#717784] dark:text-[#B8B5A5] text-left" dir="rtl">يتحرك للأمام مربعاً واحداً (أو مربعين في حركته الأولى)، ويأسر بشكل قطري.</span>
                          </div>
                          <div className="pb-1 flex justify-between gap-1 border-b border-[#989277]/5 text-right">
                            <span className="font-mono font-bold text-indigo-500 shrink-0">الحصان</span>
                            <span className="text-[#717784] dark:text-[#B8B5A5] text-left" dir="rtl">يتحرك بشكل حرف "L" وهو القطعة الوحيدة التي تقفز فوق القطع الأخرى.</span>
                          </div>
                          <div className="pb-1 flex justify-between gap-1 border-b border-[#989277]/5 text-right">
                            <span className="font-mono font-bold text-indigo-500 shrink-0">الفيل</span>
                            <span className="text-[#717784] dark:text-[#B8B5A5] text-left" dir="rtl">يتحرك بشكل قطري لأي عدد من المربعات المفتوحة.</span>
                          </div>
                          <div className="pb-1 flex justify-between gap-1 border-b border-[#989277]/5 text-right">
                            <span className="font-mono font-bold text-indigo-500 shrink-0">الرخ (القلعة)</span>
                            <span className="text-[#717784] dark:text-[#B8B5A5] text-left" dir="rtl">يتحرك أفقياً أو عمودياً لأي عدد من المربعات المفتوحة.</span>
                          </div>
                          <div className="pb-1 flex justify-between gap-1 border-b border-[#989277]/5 text-right">
                            <span className="font-mono font-bold text-indigo-500 shrink-0">الوزير (الملكة)</span>
                            <span className="text-[#717784] dark:text-[#B8B5A5] text-left" dir="rtl">أقوى قطعة، يتحرك أفقياً، عمودياً، وقطرياً.</span>
                          </div>
                          <div className="pb-1 flex justify-between gap-1 text-right">
                            <span className="font-mono font-bold text-indigo-500 shrink-0">الملك</span>
                            <span className="text-[#717784] dark:text-[#B8B5A5] text-left" dir="rtl">يتحرك مربعاً واحداً في أي اتجاه.</span>
                          </div>
                        </div>
                      </div>

                      {/* Special Rules */}
                      <div className="p-3 rounded-xl bg-white dark:bg-[#11110F] border border-[#989277]/10 space-y-1">
                        <span className="block text-[9px] font-mono text-indigo-500 uppercase font-bold">قوانين خاصة</span>
                        <ul className="list-disc list-inside text-xs pl-1 space-y-0.5 text-[#525866] dark:text-[#B8B5A5]">
                          <li><span className="font-bold text-indigo-500">التبييت:</span> حركة مشتركة بين الملك والرخ لحماية الملك.</li>
                          <li><span className="font-bold text-indigo-500">الأسر بالتجاوز:</span> حركة أسر خاصة بالبيدق (En Passant).</li>
                          <li><span className="font-bold text-indigo-500">ترقية البيدق:</span> عندما يصل البيدق لآخر رقعة الخصم يترقى لقطعة أكبر.</li>
                        </ul>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })()
      ) : joinedRoom.gameId === 'belote' ? (`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/views/WaitingRoomView.tsx', content);
