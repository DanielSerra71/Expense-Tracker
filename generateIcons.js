const sharp = require('sharp');
const fs = require('fs');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const sourceImage = 'www/img/logo.png';

if (!fs.existsSync('www/icons')) {
    fs.mkdirSync('www/icons');
}

sizes.forEach(size => {
    sharp(sourceImage)
        .resize(size, size)
        .toFile(`www/icons/icon-${size}x${size}.png`)
        .then(info => console.log(`Generated ${size}x${size} icon`))
        .catch(err => console.error(`Error generating ${size}x${size} icon:`, err));
});