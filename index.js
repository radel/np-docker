#!/usr/bin/env node
/**
 * Module dependencies.
 */

var program = require('commander');
var nconf = require('nconf');
var siteconf = require('nconf');
var os = require("os");
var fs = require('fs');
var sys = require('util')
var child_process = require('child_process');
var execSync = require('child_process').execSync;
var yaml = require('write-yaml');
var readYaml = require('read-yaml');

program
.version('0.0.1')
.option('-c, --config [string]', 'file di configurazione da usare', 'config.json')
.option('-e, --email [string]', 'email per l\'installazione di wordpress', '');

if (process.argv.length < 3) {
    program.help();
}

program.parse(process.argv);
var configfile = program.config;

fs.access(os.homedir()+'/.config/np-docker/config.json',fs.F_OK, function(err) {
    if(err) {
        console.log('Non hai i file di configurazione, li creo in ~/.config/np-docker ;)');
        execSync('mkdir ~/.config/np-docker/', {stdio:[0,1,2]});
        execSync('cp '+__dirname+'/config.json ~/.config/np-docker/config.json', {stdio:[0,1,2]});
        execSync('cp '+__dirname+'/docker-compose.yml ~/.config/np-docker/docker-compose.yml', {stdio:[0,1,2]});
        return;
    }
});

fs.access('./'+configfile,fs.F_OK, function(err) {
    if (!err) {
        nconf.use('file', {file: '~/.config/np-docker/config.json'});
        nconf.load();
        var email = program.email || nconf.get('email') ;
        siteconf.use('file', { file: './'+configfile });
        siteconf.load();
        var wpusername = siteconf.get('wordpress:username');
        var wppassword = siteconf.get('wordpress:password');
        readYaml(os.homedir() + '/.config/np-docker/docker-compose.yml', function(err, data) {
        if (err) throw err;
            data.db.volumes = [process.cwd()+'/db/:/var/lib/mysql'];
            data.wp.volumes = [process.cwd()+'/wp_html/:/var/www/html'];
            yaml.sync('docker-compose.yml', data);
            execSync('mkdir wp_html', {stdio:[0,1,2]});
            execSync('mkdir db', {stdio:[0,1,2]});
            execSync('docker-compose up -d', {stdio:[0,1,2]});
            //execSync('sudo chmod -R 777 ./wp_html/wp-content', {cwd: process.cwd(), stdio:[0,1,2]});
            //execSync('wp core install --url=www.'+siteconf.get('vesta:username')+'.dev --title="'+siteconf.get('vesta:username')+'" --admin_user='+wpusername+' --admin_password='+wppassword+' --admin_email="'+email+'"', {cwd: process.cwd(), stdio:[0,1,2]});
            console.log('Installazione eseguita! Aggiorna il tuo file host:');
            console.log('127.0.1.1   www.'+siteconf.get('vesta:username')+'.dev');
        });
    } else {
        console.log("il file di configurazione specificato non è stato trovato");
    }
});
