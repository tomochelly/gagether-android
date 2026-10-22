import type {Game} from './types';

// Options and records must use the same scope. Direct game navigation remains
// independent of favorites, including when the global preference is enabled.
export function historyGameFilter(games:Game[],chosenGame:string,myOnly:boolean,favorites:string[],gameId?:string){
 const availableGames=myOnly&&!gameId?games.filter(game=>favorites.includes(game.id)):games;
 const selectedGameId=gameId||(availableGames.some(game=>game.id===chosenGame)?chosenGame:'all');
 return {availableGames,selectedGameId};
}
