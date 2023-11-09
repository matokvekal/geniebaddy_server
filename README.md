# Deploying GenieBaddy  stack on Ubuntu 20.04

> Detailed step by step procedure to deploying PERN(mysql, Express, React, Node) stack on Ubuntu 20.04 with NGINX and SSL

1.create new ec2:
ubuntu
create key pair
save the .pem at c://.ssh

connect :

ssh -i "c://program Files/.ssh/commisaire-2023.pem" ubuntu@ec2-3-67-113-2.eu-central-1.compute.amazonaws.com
 sudo apt update
sudo apt upgrade -y

## 3. Copy github repo to sever
mkdir apps
cd apps
mkdir genieBaddy
cd genieBaddy


 clone the project repo
```
cd yelp-app
git clone https://github.com/Sanjeev-Thiyagarajan/PERN-STACK-DEPLOYMENT.git .
```

## 4. Install Node
To install Node on Ubuntu follow the steps detailed in:
https://github.com/nodesource/distributions/blob/master/README.md

```
curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 5. Install and Configure PM2
We never want to run *node* directly in production. Instead we want to use a process manager like PM2 to handle running our backend server. PM2 will be responsible for restarting the App if/when it crashes :grin:

```
sudo npm install pm2 -g
```
Point pm2 to the location of the server.js file so it can start the app. We can add the `--name` flag to give the process a descriptive name
```
pm2 start /home/ubuntu/apps/yelp-app/server/server.js --name yelp-app
```

Configure PM2 to automatically startup the process after a reboot

```
ubuntu@ip-172-31-20-1:~$ pm2 startup
[PM2] Init System found: systemd
[PM2] To setup the Startup Script, copy/paste the following command:
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```
The output above gives you a specific command to run, copy and paste it into the terminal. The command given will be different on your machine depending on the username, so do not copy the output above, instead run the command that is given in your output.

```
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

Verify that the App is running

```
pm2 status
```
After verify App is running, save the current list of processes so that the same processes are started during bootup. If the list of processes ever changes in the future, you'll want to do another `pm2 save`

```
pm2 save
```

## 6. Deploy React Frontend
Navigate to the client directory in our App code and run `npm run build`. 

This will create a finalized production ready version of our react frontent in directory called `build`. The build folder is what the NGINX server will be configured to serve.

```
ubuntu@ip-172-31-20-1:~/apps/yelp-app/client$ ls
README.md  build  node_modules  package-lock.json  package.json  public  src
ubuntu@ip-172-31-20-1:~/apps/yelp-app/client$ cd build/
ubuntu@ip-172-31-20-1:~/apps/yelp-app/client/build$ ls
asset-manifest.json  favicon.ico  index.html  logo192.png  logo512.png  manifest.json  precache-manifest.ee13f4c95d9882a5229da70669bb264c.js  robots.txt  service-worker.js  static
ubuntu@ip-172-31-20-1:~/apps/yelp-app/client/build$
```

## 7. Install and Configure NGINX

Install and enable NGINX
```
sudo apt install nginx -y
sudo systemctl enable nginx
```

NGINX is a feature-rich webserver that can serve multiple websites/web-apps on one machine. Each website that NGINX is responsible for serving needs to have a seperate server block configured for it.

Navigate to '/etc/nginx/sites-available'

```
cd /etc/nginx/sites-available
```

There should be a server block called `default`

```
ubuntu@ip-172-31-20-1:/etc/nginx/sites-available$ ls
default 
```
The default server block is what will be responsible for handling requests that don't match any other server blocks. Right now if you navigate to your server ip, you will see a pretty bland html page that says NGINX is installed. That is the `default` server block in action. 

We will need to configure a new server block for our website. To do that let's create a new file in `/etc/nginx/sites-available/` directory. We can call this file whatever you want, but I recommend that you name it the same name as your domain name for your app. In this example my website will be hosted at *sanjeev.xyz* so I will also name the new file `sanjeev.xyz`. But instead of creating a brand new file, since most of the configs will be fairly similar to the `default` server block, I recommend copying the `default` config.

```
cd /etc/nginx/sites-available
sudo cp default sanjeev.xyz
```

open the new server block file `sanjeev.xyz` and modify it so it matches below:

```
server {
        listen 80;
        listen [::]:80;

         root /home/ubuntu/apps/yelp-app/client/build;

        # Add index.php to the list if you are using PHP
        index index.html index.htm index.nginx-debian.html;

        server_name sanjeev.xyz www.sanjeev.xyz;

        location / {
                try_files $uri /index.html;
        }

         location /api {
            proxy_pass http://localhost:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

}
```

**Let's go over what each line does**

The first two lines `listen 80` and `listen [::]:80;` tell nginx to listen for traffic on port 80 which is the default port for http traffic. Note that I removed the `default_server` keyword on these lines. If you want this server block to be the default then keep it in

`root /home/ubuntu/apps/yelp-app/client/build;` tells nginx the path to the index.html file it will server. Here we passed the path to the build directory in our react app code. This directory has the finalized html/js/css files for the frontend.

`server_name sanjeev.xyz www.sanjeev.xyz;` tells nginx what domain names it should listen for. Make sure to replace this with your specific domains. If you don't have a domain then you can put the ip address of your ubuntu server.

The configuration block below is needed due to the fact that React is a Singe-Page-App. So if a user directly goes to a url that is not the root url like `https://sanjeev.xyz/restaurants/4` you will get a 404 cause NGINX has not been configured to handle any path ohter than the `/`. This config block tells nginx to redirect everything back to the `/` path so that react can then handle the routing.

```
        location / {
                try_files $uri /index.html;
        }
```

The last section is so that nginx can handle traffic destined to the backend. Notice the location is for `/api`. So any url with a path of `/api` will automatically follow the instructions associated with this config block. The first line in the config block `proxy_pass http://localhost:3001;` tells nginx to redirect it to the localhost on port 3001 which is the port that our backend process is running on. This is how traffic gets forwarded to the Node backend. If you are using a different port, make sure to update that in this line.

**Enable the new site**
```
sudo ln -s /etc/nginx/sites-available/sanjeev.xyz /etc/nginx/sites-enabled/
systemctl restart nginx
```

## 8. Configure Environment Variables
We now need to make sure that all of the proper environment variables are setup on our production Ubuntu Server. In our development environment, we made use of a package called dotenv to load up environment variables. In the production environment the environment variables are going to be set on the OS instead of within Node. 

Create a file called `.env` in `/home/ubuntu/`. The file does not need to be named `.env` and it does not need to be stored in `/home/ubuntu`, these were just the name/location of my choosing. The only thing I recommend avoid doing is placing the file in the same directory as the app code as we want to make sure we don't accidentally check our environment variables into git and end up exposing our credentials.

Within the .env file paste all the required environment variables

```
PORT=3001
PGUSER=postgres
PGHOST=localhost
PGPASSWORD=password123
PGDATABASE=yelp
PGPORT=5432 
NODE_ENV=production
```

You'll notice I also set `NODE_ENV=production`. Although its not required for this example project, it is common practice. For man other projects(depending on how the backend is setup) they may require this to be set in a production environment.


In the `/home/ubuntu/.profile` add the following line to the bottom of the file

```
set -o allexport; source /home/ubuntu/.env; set +o allexport
```

For these changes to take affect, close the current terminal session and open a new one. 

Verify that the environment variables are set by running the `printenv`

```
# printenv
```

## 9. Enable Firewall

```
sudo ufw status
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
sudo ufw status
```

## 10. Enable SSL with Let's Encrypt
Nowadays almost all websites use HTTPS exclusively. Let's use Let's Encrypt to generate SSL certificates and also configure NGINX to use these certificates and redirect http traffic to HTTPS.

The step by step procedure is listed at:
https://certbot.eff.org/lets-encrypt/ubuntufocal-nginx.html


Install Certbot

```
sudo snap install --classic certbot
```

Prepare the Certbot command

```
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

Get and install certificates using interactive prompt

```
sudo certbot --nginx
```

## Authors
* **Sanjeev Thiyagarajan** - *CEO of Nothing*
