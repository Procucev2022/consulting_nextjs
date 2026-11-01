const fs = require('fs');

// 1) PENDING_APPROVAL_MAPPINGS:
const sumPending = 581170000 + 159000000 + 366840000 + 153722000 + 69585000;
console.log('5 items sum:', sumPending, 'Pending bucket:', 1330469564.0);
console.log('Diff in Pending bucket:', 1330469564.0 - sumPending);
