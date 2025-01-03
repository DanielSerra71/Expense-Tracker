const fs = require('fs');

// Lee el archivo de imagen
const image = fs.readFileSync('android/app/src/main/assets/public/assets/logo.png');
// Convierte a base64
const base64 = image.toString('base64');
// Imprime el resultado
console.log(`data:image/png;base64,${base64}`); 