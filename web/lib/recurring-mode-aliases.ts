/** Reviewed names for the same mode, not fuzzy title matching. */
const aliases:Record<string,Record<string,string>>={
 bluearchive:{'bluearchive-total-assault':'total-assault','bluearchive-grand-assault':'grand-assault','bluearchive-joint-firing-drill':'joint-firing-drill'},
 zzz:{'shiyu-critical':'shiyu-defense','hollow-zero-bounties':'hollow-zero'},
 hi3:{abyss:'superstring-dimension'},
 arknights:{'arknights-annihilation':'annihilation','arknights-annihilation-map':'annihilation'},
 gfl2:{'gunsmoke-frontline':'boss-challenge','dust-front':'boss-challenge','expansion-drills':'expansion-training','peak-value-assessment':'limit-assessment','extreme-assessment':'limit-assessment'},
 trickcal:{'dimension-crash':'dimension-clash'},
 stellasora:{'boss-blitz':'joint-suppression','cataclysm-survivor':'catastrophe-front'},
 nte:{'beyond-the-orbit':'beyond-the-rails'},
 dna:{'nocturnal-echoes':'nightmare-echoes'}
};
export const combatModeForRecurring=(gameId:string,id:string)=>aliases[gameId]?.[id]||id;
