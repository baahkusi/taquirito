// tests
const items = [
    { name: 'item1 name hash', lot_number: 'item1 lot', ean_code: '221B', expiration_date: '2030-01-01' },
    { name: 'item2 name hash', lot_number: 'item2 lot', ean_code: '221C', expiration_date: '2040-01-01' },
    { name: 'item3 name hash', lot_number: 'item3 lot', ean_code: '221D', expiration_date: '2050-01-01' }
];

const cert1 = 'edskS6DTBx1QXuZ23eR93MgymHrAp9yn2Vaxp8jXtK7W6hqtarRSMRHFX32Qw2KzDcMtLaqQkXuHgsEEfgChumsnZuaboLqd1q';
const cert2 = 'edskRfGKLMopiw47tzcKpxDdVZt3WD8kt9V6MgkPS5aNEfPQeXn8gr5y9fFQ2THDQxFCPLWWoYR7QzaNNg8k6tkdwBFBd1ctfV';
const invalidcert3 = 'edskRmFXVMBdP2k8Wd2UsKx1S6GFn6BSZQCyVeXUbSewLANPQCvbmtm5hJ5auuL3mQ67ueTqLSnR4tuTT5MDJZ7XUiNea9bMWd';

validateCredentials('cert1', cert1);
validateCredentials('cert2', cert2)
