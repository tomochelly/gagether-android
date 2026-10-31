import guides from '../content/wuwa-build-guides.json' with {type:'json'};
export function characterBuildGuide(id:string){
 const build=guides.builds.find(b=>b.characterId===id);if(!build)return null;
 const ids=new Set([id,...build.teams.flatMap(t=>t.slots.flat())]);
 return {version:guides.version,gameId:guides.gameId,service:guides.service,checkedAt:guides.checkedAt,basis:guides.basis,builds:[build],characters:guides.characters.filter(c=>ids.has(c.id))};
}
export type CharacterBuildGuide=NonNullable<ReturnType<typeof characterBuildGuide>>;
