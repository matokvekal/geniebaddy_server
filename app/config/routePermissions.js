export default {
	'/login': ['all'],
	'/register': ['all'],
	'/forgot_password': ['all'],
	'/reset_password': ['all'],
	'/confirmCodeEmail': ['all'],
	'/useraction': ['user'],
	'/getpostbyid': ['user'],
	'/userreadposts': ['user'],
	'/userposts': ['user'],
	'/userpost': ['user'],
	'/usernewchats': ['user'],
	'/getuserlimits': ['user'],
	'/geniegetpostbyid': ['genie'],
	'/topics': ['user', 'genie'],
	'/genieposts': ['genie'],
	'/geniechoosepost': ['genie'],
	'/genienewposts': ['genie'],
	'/geniepost': ['genie'],
	'/geniereadposts': ['genie'],
};
