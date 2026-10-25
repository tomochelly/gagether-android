import './load-typescript.mjs';import {test} from 'node:test';import assert from 'node:assert/strict';
const {matchesIfNoneMatch}=await import('../lib/http-cache.ts');
test('GET validators accept gzip weak tags, lists and commas inside opaque tags without accepting malformed fields',()=>{
 for(const value of ['"exact"','W/"exact"',' "other", W/"exact" ','*',', ,W/"exact",,'])assert.equal(matchesIfNoneMatch(value,'"exact"'),true,value);
 assert.equal(matchesIfNoneMatch('"first", W/"tag,with,commas", "last"','W/"tag,with,commas"'),true);
 assert.equal(matchesIfNoneMatch('""','W/""'),true);
 for(const value of [null,'','W/"changed"','w/"exact"','junk"exact"','W/exact','"exact" junk','"exact", *','"exact','"bad\nvalue", "exact"'])assert.equal(matchesIfNoneMatch(value,'"exact"'),false,String(value));
});
