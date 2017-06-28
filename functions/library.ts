export function randomString(seed = '') {
    let d = new Date();
    let unique = seed + '-' + d.getTime() + '-';
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 8; i++) {
        unique += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return unique;
}