// mqtt設定
var mqtt = require('mqtt');
var opt = {
    port: 1883,
    clientId: 'nodejs',
    username: 'PK5WSEH0SBUA13XT4K',
    password: 'PK5WSEH0SBUA13XT4K'
};

// sql設定
var mysql = require('mysql');
var conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'lcm'
});

// 日期取得
var sd = require('silly-datetime');

// 連接MQTT
var hostname = 'tcp://61.58.248.108';
var client = mqtt.connect(hostname, opt);
client.on('connect', function () {
    console.log('已連接至MQTT：' + hostname + '\n');
    client.subscribe("lcmData/#");
});

// 接收訊息
client.on('message', function (topic, message) {
    console.log('收到 ' + topic + ' 主題，訊息：' + message.toString());
    console.log('時間 ' + sd.format(new Date, 'YYYY-MM-DD HH:mm:ss'));
    dataProcess(message);
});

//資料處理
function dataProcess(message) {
    var json = JSON.parse(message);
    var ip = json.deviceIP;
    var mac = json.deviceMAC;
    var color = json.color;
    console.log(mac + '\n');
    var sql = 'SELECT COUNT(`ip`) as num FROM `ip_table` WHERE ip = ?';
    var params = [ip];
    conn.query(sql, params, function (err, result) {
        if (err) throw err;
        if (result[0].num == 0) {
            sql = 'INSERT INTO `ip_table`(`ip`) VALUES (?)';
            params = [ip];
            conn.query(sql, params, function (err, result) {
                if (err) throw err;
                sql = 'INSERT INTO `lcmdata`(`ip`, `device_mac`, `color`) VALUES (?, ?, "WHITE"), (?, ?, "BLACK"), (?, ?, "RED"), (?, ?, "GREEN"), (?, ?, "BLUE")';
                params = [ip, mac, ip, mac, ip, mac, ip, mac, ip, mac];
                conn.query(sql, params, function (err, result) {
                    if (err) throw err;
                });
            });
        }
        sql = 'UPDATE `lcmdata` SET `lcm_power` = ?, `lcm_current` = ?, `backlight_power` = ?, `backlight_current` = ? WHERE `ip` = ? AND `color` = ?';
        params = [json.data[0], json.data[1], json.data[2], json.data[3], ip, color];
        conn.query(sql, params, function (err, result) {
            if (err) throw err;
        });
    });
}