test cycling // ALL HAS BEEN CHANGE        NEED TO FIX   7-5-2023

action 1
run   http://3.69.0.216:5000/api/free/races 
Expected :
1)new user at table users with  is_register=1 and cycling_activated=1   (we will delete it after the poc) so you will have to real registration
2)response will have token


action 2
run  http://3.69.0.216:5000/api/cycling/config
+ token
+ data example
   {
        "type": "rider", 
        "nick_name": "רוכב 2",
        "mobile": "0542288531",
        "from": "אילת",
        "to": "ים המלח",
        "puncture": 1,
        "can_help": 1,
        "difribliator": 0,
        "first_aid": 1,
        "water": 1,
        "some_data": 1,
        "is_private": 1,
        "need_help": 0,
        "location_long": "33.2213",
        "location_lat": "34.2213",
        "time":"2023-03-25 09:39:05"
       }
Expected :
1)if user not exist at cycling_active then insert new row
else update the user configuration at cycling_active
2)insert data to cycling_history
3)response the user all his active conected cyclist from cycling_conected




action2
run http://3.69.0.216:5000/api/cycling/location
 { "addRider":"18455",
  "hideRider":null,   
   "showRider":null,    
  "deleteRider":null,   
   "lat":"34.2222",
	"long":"35.444",
   "time":"2023-03-25 09:39:05"
}
expected:
1.update new location for rider at cycling_active 
2.insert location to cycling_location_history
3.if user2 exist and:
addRider- add to cycling_conected  or update if was deleted Only by user 1

deleteRider-update cycling_conected  to deleted=1 from user 1

hideRider-update cycling_conected  to hidden=1 by user 1

showRider-update cycling_conected set is_hidden=0 if was hiden by user 1

4.select al conected that not hidden and not deleted and have location
.select all riders that need help 
select all riders that in radius  and have location  if not private get name and phone else only location)


action 3
1.rider 1 delete conected rider 2
expected thsy wont see each other
2.rider 2 try conect to rider 1
he cant
3.rider 1 conect rider  2
he succied
4.same with hide/view
5.when they deleted  and rider 2 need help
accepted  rider 1 can see 2
6.try conect more then 20
fail


