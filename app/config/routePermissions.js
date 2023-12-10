export default {
	'/login': ['all'],
	'/register': ['all'],
	'/forgot_password': ['all'],
	'/reset_password': ['all'],
	'/confirmCodeEmail': ['all'],
	'/action': ['user'],
	'/getpostbyid': ['user'],
	'/userreadposts': ['user'],
	'/userrefreshposts': ['all'],
	'/genierefreshposts': ['genie'],
	'/userpost': ['user'],
	'/userposts': ['user'],
	'/usernewchats': ['user'],
	'/getuserlimits': ['user'],
	'/geniegetpostbyid': ['genie'],
	'/topics': ['user', 'genie'],
	'/genieposts': ['genie'],
	'/genieclamepost': ['genie'],
	'/genienewposts': ['genie'],
	'/geniepost': ['genie'],
	'/geniereadposts': ['genie'],
	'/genienewchats': ['genie'],
};
