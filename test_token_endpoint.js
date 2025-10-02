#!/usr/bin/env node

/**
 * Test script to verify the token endpoint is working correctly
 */

const http = require('http');

// Configuration - make sure these match your environment
const PORT = process.env.PORT || 3000;
const HOST = 'localhost';
const ROOM_NAME = 'test-room';
const IDENTITY = 'test-user';

console.log(`Testing token endpoint at http://${HOST}:${PORT}/token`);

const testUrl = `http://${HOST}:${PORT}/token?room=${encodeURIComponent(ROOM_NAME)}&identity=${encodeURIComponent(IDENTITY)}`;

const request = http.get(testUrl, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response headers:', res.headers);
    console.log('Response body:', data);
    
    try {
      const response = JSON.parse(data);
      
      if (res.statusCode === 200) {
        console.log('✅ Token endpoint is working correctly!');
        console.log(`- Token generated for room: ${response.room}`);
        console.log(`- LiveKit URL: ${response.url}`);
        console.log(`- Token present: ${!!response.token}`);
      } else {
        console.log('❌ Token endpoint returned an error:');
        console.log(response);
      }
    } catch (e) {
      console.log('❌ Response is not valid JSON');
      console.log('Raw response:', data);
    }
  });
});

request.on('error', (err) => {
  console.error('❌ Error connecting to token endpoint:', err.message);
  console.log(`Make sure the server is running on http://${HOST}:${PORT}`);
});

request.end();