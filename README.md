# About
## nodestat of biocomputing
This is a small tool, used for collecting the necessary information from all cluster nodes and summarize it on a table

# Usage
```
mkdir -p /opt/nodestat
cd /opt
git clone https://github.com/adiehl/nodestat.git
cd nodestat
npm install
```
Then append this to crontab
```
*/5 * * * * /usr/bin/node /opt/nodestat/nodestat.js
```
And link the htdocs to a apache accessible directory
```
ln -s /opt/nodestat/htdocs /var/www/html/nodestat
```
(don't forget to add +FollowSymlinks to Apache Configuration