#!/bin/bash

# Script to add dummy brokers and leads
# Make sure your backend is running on port 3001
# You'll need to replace TOKEN with a valid authentication token

API_URL="http://localhost:3001"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3NjE5MDc4NDEsImV4cCI6MTc2MjUxMjY0MX0.vmtSRrAdmkbvDL2NLk-ZIz7ebzyHMIwDfBVwGkq1rqc"

if [ "$TOKEN" = "YOUR_TOKEN_HERE" ]; then
    echo "Please replace TOKEN with a valid authentication token"
    echo "You can get this by:"
    echo "1. Opening browser dev tools"
    echo "2. Going to Application/Storage > Local Storage"
    echo "3. Finding the 'token' key"
    echo "4. Copying its value"
    echo "5. Edit this script and replace YOUR_TOKEN_HERE with the token"
    exit 1
fi

echo "Adding dummy brokers..."

# Broker 1: Express Logistics
curl -X POST "$API_URL/api/brokers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "companyName": "Express Logistics Pvt Ltd",
    "personName": "Rajesh Kumar",
    "phone": "+91-9876543210",
    "alternatePhone": "+91-9876543211",
    "city": "Mumbai",
    "remarks": "Specializes in heavy machinery transport",
    "referrer": "Trade Association",
    "regions": [
      {"region": "Western", "state": "Maharashtra", "city": "Mumbai"},
      {"region": "Western", "state": "Gujarat", "city": "Ahmedabad"},
      {"region": "Northern", "state": "Rajasthan", "city": "Jaipur"},
      {"region": "Northern", "state": "Delhi", "city": "New Delhi"}
    ],
    "vehicleTypes": ["32 Ft Trailer", "40 Ft Container", "Heavy Duty Truck", "Open Body Truck"]
  }'

# Broker 2: Rapid Transport
curl -X POST "$API_URL/api/brokers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "companyName": "Rapid Transport Solutions",
    "personName": "Suresh Patel",
    "phone": "+91-9123456789",
    "alternatePhone": "+91-9123456790",
    "city": "Ahmedabad",
    "remarks": "Fast delivery, competitive rates",
    "referrer": "Business Partner",
    "regions": [
      {"region": "Western", "state": "Gujarat", "city": "Ahmedabad"},
      {"region": "Northern", "state": "Rajasthan", "city": "Jodhpur"},
      {"region": "Central", "state": "Madhya Pradesh", "city": "Indore"}
    ],
    "vehicleTypes": ["Tata Ace", "14 Ft Truck", "19 Ft Truck", "Eicher Truck"]
  }'

# Broker 3: National Freight
curl -X POST "$API_URL/api/brokers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "companyName": "National Freight Carriers",
    "personName": "Amit Singh",
    "phone": "+91-8765432109",
    "city": "Delhi",
    "remarks": "Pan-India operations, reliable service",
    "referrer": "Online Directory",
    "regions": [
      {"region": "Northern", "state": "Delhi", "city": "Delhi"},
      {"region": "Northern", "state": "Punjab", "city": "Chandigarh"},
      {"region": "Northern", "state": "Haryana", "city": "Gurgaon"},
      {"region": "Northern", "state": "Uttar Pradesh", "city": "Noida"},
      {"region": "Northern", "state": "Uttarakhand", "city": "Dehradun"}
    ],
    "vehicleTypes": ["Mini Truck", "14 Ft Truck", "17 Ft Truck", "19 Ft Truck", "24 Ft Truck"]
  }'

# Broker 4: Southern Express
curl -X POST "$API_URL/api/brokers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "companyName": "Southern Express Logistics",
    "personName": "Venkat Reddy",
    "phone": "+91-7654321098",
    "alternatePhone": "+91-7654321099",
    "city": "Bangalore",
    "remarks": "Excellent for South India routes",
    "referrer": "IndiaMart",
    "regions": [
      {"region": "Southern", "state": "Karnataka", "city": "Bangalore"},
      {"region": "Southern", "state": "Tamil Nadu", "city": "Chennai"},
      {"region": "Southern", "state": "Andhra Pradesh", "city": "Hyderabad"},
      {"region": "Southern", "state": "Kerala", "city": "Kochi"},
      {"region": "Southern", "state": "Telangana", "city": "Hyderabad"}
    ],
    "vehicleTypes": ["Tempo", "14 Ft Truck", "19 Ft Truck", "Container Truck"]
  }'

# Broker 5: Western Cargo
curl -X POST "$API_URL/api/brokers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "companyName": "Western Cargo Movers",
    "personName": "Deepak Sharma",
    "phone": "+91-6543210987",
    "city": "Pune",
    "remarks": "Cost-effective solutions",
    "regions": [
      {"region": "Western", "state": "Maharashtra", "city": "Pune"},
      {"region": "Western", "state": "Goa", "city": "Panaji"},
      {"region": "Southern", "state": "Karnataka", "city": "Mangalore"}
    ],
    "vehicleTypes": ["Mini Truck", "17 Ft Truck", "20 Ft Container"]
  }'

echo -e "\nAdding dummy leads..."

# Lead 1: Priya Industries
curl -X POST "$API_URL/api/leads" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Priya Industries",
    "phone": "+91-9988776655",
    "alternatePhone": "+91-9988776656",
    "source": "india_mart",
    "referrer": "Online Portal"
  }'

# Lead 2: Global Manufacturing
curl -X POST "$API_URL/api/leads" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Global Manufacturing Co.",
    "phone": "+91-8877665544",
    "source": "just_dial",
    "referrer": "JustDial Listing"
  }'

# Lead 3: Tech Solutions
curl -X POST "$API_URL/api/leads" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Tech Solutions Pvt Ltd",
    "phone": "+91-7766554433",
    "alternatePhone": "+91-7766554434",
    "source": "referral",
    "referrer": "Existing Client - ABC Corp"
  }'

# Lead 4: Modern Textiles
curl -X POST "$API_URL/api/leads" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Modern Textiles",
    "phone": "+91-6655443322",
    "source": "india_mart",
    "referrer": "IndiaMart Lead"
  }'

# Lead 5: Agricultural Exports
curl -X POST "$API_URL/api/leads" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Agricultural Exports Ltd",
    "phone": "+91-5544332211",
    "alternatePhone": "+91-5544332212",
    "source": "referral",
    "referrer": "Trade Association"
  }'

# Lead 6: Automobile Parts
curl -X POST "$API_URL/api/leads" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Automobile Parts Co.",
    "phone": "+91-4433221100",
    "source": "unknown"
  }'

# Lead 7: Pharma Distributors
curl -X POST "$API_URL/api/leads" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Pharma Distributors",
    "phone": "+91-3322110099",
    "alternatePhone": "+91-3322110098",
    "source": "just_dial",
    "referrer": "JustDial Premium"
  }'

# Lead 8: Electronics Warehouse
curl -X POST "$API_URL/api/leads" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Electronics Warehouse",
    "phone": "+91-2211009988",
    "source": "india_mart",
    "referrer": "IndiaMart Premium"
  }'

echo -e "\nDone! Check your application to see the new data."
echo "If you see any errors, make sure:"
echo "1. Your backend is running on port 3001"
echo "2. You've replaced TOKEN with a valid authentication token"
echo "3. You're logged into the application"