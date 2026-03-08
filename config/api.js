import axios from 'axios';

var serverUrl = 'https://crm-server-three-blond.vercel.app';

var api = axios.create({
  baseURL: serverUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

var authToken = null;

export var setToken = function(token) {
  authToken = token;
  api.defaults.headers.common['Authorization'] = 'Bearer ' + token;
};

export var clearToken = function() {
  authToken = null;
  delete api.defaults.headers.common['Authorization'];
};

export var getToken = function() { return authToken; };

export default api;