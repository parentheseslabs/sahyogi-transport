#!/bin/bash

# Script to add dummy transport routes and rate enquiries
# Make sure your backend is running on port 3001

API_URL="http://localhost:3001"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3NjE5MDc4NDEsImV4cCI6MTc2MjUxMjY0MX0.vmtSRrAdmkbvDL2NLk-ZIz7ebzyHMIwDfBVwGkq1rqc"

if [ "$TOKEN" = "YOUR_TOKEN_HERE" ]; then
    echo "Please replace TOKEN with a valid authentication token"
    exit 1
fi

echo "Adding transport routes first..."

# Route 1: Mumbai to Delhi
ROUTE1_RESPONSE=$(curl -s -X POST "$API_URL/api/transport-routes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Mumbai - Delhi Express Route",
    "locations": [
      {"location": "Mumbai, Maharashtra", "sequence": 1},
      {"location": "Nashik, Maharashtra", "sequence": 2},
      {"location": "Indore, Madhya Pradesh", "sequence": 3},
      {"location": "Delhi, NCR", "sequence": 4}
    ]
  }')
ROUTE1_ID=$(echo $ROUTE1_RESPONSE | grep -o '"id":[0-9]*' | grep -o '[0-9]*')

# Route 2: Chennai to Kolkata
ROUTE2_RESPONSE=$(curl -s -X POST "$API_URL/api/transport-routes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Chennai - Kolkata Coastal Route",
    "locations": [
      {"location": "Chennai, Tamil Nadu", "sequence": 1},
      {"location": "Visakhapatnam, Andhra Pradesh", "sequence": 2},
      {"location": "Bhubaneswar, Odisha", "sequence": 3},
      {"location": "Kolkata, West Bengal", "sequence": 4}
    ]
  }')
ROUTE2_ID=$(echo $ROUTE2_RESPONSE | grep -o '"id":[0-9]*' | grep -o '[0-9]*')

# Route 3: Bangalore to Pune
ROUTE3_RESPONSE=$(curl -s -X POST "$API_URL/api/transport-routes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Bangalore - Pune Highway",
    "locations": [
      {"location": "Bangalore, Karnataka", "sequence": 1},
      {"location": "Hubli, Karnataka", "sequence": 2},
      {"location": "Pune, Maharashtra", "sequence": 3}
    ]
  }')
ROUTE3_ID=$(echo $ROUTE3_RESPONSE | grep -o '"id":[0-9]*' | grep -o '[0-9]*')

# Route 4: Ahmedabad to Jaipur
ROUTE4_RESPONSE=$(curl -s -X POST "$API_URL/api/transport-routes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Gujarat - Rajasthan Corridor",
    "locations": [
      {"location": "Ahmedabad, Gujarat", "sequence": 1},
      {"location": "Udaipur, Rajasthan", "sequence": 2},
      {"location": "Jaipur, Rajasthan", "sequence": 3}
    ]
  }')
ROUTE4_ID=$(echo $ROUTE4_RESPONSE | grep -o '"id":[0-9]*' | grep -o '[0-9]*')

echo -e "\nAdding transport broker rate enquiries..."

# Rate Enquiry 1: Electronics from Mumbai to Delhi
curl -X POST "$API_URL/api/transport-broker-rate-enquiries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"route_id\": ${ROUTE1_ID:-1},
    \"cargoType\": \"Electronics & IT Equipment\",
    \"cargoWeight\": 8.5,
    \"transportDate\": \"2024-01-15T00:00:00Z\",
    \"remarks\": \"Fragile items, need GPS tracking and insurance\"
  }"

# Rate Enquiry 2: Textiles from Chennai to Kolkata
curl -X POST "$API_URL/api/transport-broker-rate-enquiries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"route_id\": ${ROUTE2_ID:-2},
    \"cargoType\": \"Textile & Garments\",
    \"cargoWeight\": 15.0,
    \"transportDate\": \"2024-01-18T00:00:00Z\",
    \"remarks\": \"Bulk shipment, weather protection required\"
  }"

# Rate Enquiry 3: Auto Parts from Bangalore to Pune
curl -X POST "$API_URL/api/transport-broker-rate-enquiries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"route_id\": ${ROUTE3_ID:-3},
    \"cargoType\": \"Automobile Spare Parts\",
    \"cargoWeight\": 12.5,
    \"transportDate\": \"2024-01-20T00:00:00Z\",
    \"remarks\": \"Multiple pickup points in Bangalore industrial area\"
  }"

# Rate Enquiry 4: Food Products from Ahmedabad to Jaipur
curl -X POST "$API_URL/api/transport-broker-rate-enquiries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"route_id\": ${ROUTE4_ID:-4},
    \"cargoType\": \"FMCG & Food Products\",
    \"cargoWeight\": 20.0,
    \"transportDate\": \"2024-01-22T00:00:00Z\",
    \"remarks\": \"Temperature controlled transport required, max 25°C\"
  }"

# Rate Enquiry 5: Industrial Machinery
curl -X POST "$API_URL/api/transport-broker-rate-enquiries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"route_id\": ${ROUTE1_ID:-1},
    \"cargoType\": \"Heavy Industrial Machinery\",
    \"cargoWeight\": 35.0,
    \"transportDate\": \"2024-01-25T00:00:00Z\",
    \"remarks\": \"ODC cargo, special permits required, crane loading needed\"
  }"

# Rate Enquiry 6: Chemicals
curl -X POST "$API_URL/api/transport-broker-rate-enquiries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"route_id\": ${ROUTE2_ID:-2},
    \"cargoType\": \"Chemical Products (Non-Hazardous)\",
    \"cargoWeight\": 18.5,
    \"transportDate\": \"2024-01-28T00:00:00Z\",
    \"remarks\": \"Proper documentation and safety equipment mandatory\"
  }"

# Rate Enquiry 7: Construction Materials
curl -X POST "$API_URL/api/transport-broker-rate-enquiries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"route_id\": ${ROUTE3_ID:-3},
    \"cargoType\": \"Construction Materials\",
    \"cargoWeight\": 40.0,
    \"transportDate\": \"2024-02-01T00:00:00Z\",
    \"remarks\": \"Cement bags and steel rods, tarpaulin cover required\"
  }"

# Rate Enquiry 8: Pharmaceuticals
curl -X POST "$API_URL/api/transport-broker-rate-enquiries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"route_id\": ${ROUTE4_ID:-4},
    \"cargoType\": \"Pharmaceutical Products\",
    \"cargoWeight\": 5.5,
    \"transportDate\": \"2024-02-05T00:00:00Z\",
    \"remarks\": \"Cold chain maintenance critical, 2-8°C temperature range\"
  }"

# Rate Enquiry 9: Furniture
curl -X POST "$API_URL/api/transport-broker-rate-enquiries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"route_id\": ${ROUTE1_ID:-1},
    \"cargoType\": \"Furniture & Home Decor\",
    \"cargoWeight\": 10.0,
    \"transportDate\": \"2024-02-08T00:00:00Z\",
    \"remarks\": \"Fragile wooden furniture, bubble wrap packing done\"
  }"

# Rate Enquiry 10: Agricultural Products
curl -X POST "$API_URL/api/transport-broker-rate-enquiries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"route_id\": ${ROUTE2_ID:-2},
    \"cargoType\": \"Agricultural Produce\",
    \"cargoWeight\": 25.0,
    \"transportDate\": \"2024-02-10T00:00:00Z\",
    \"remarks\": \"Fresh vegetables, quick transit time essential\"
  }"

echo -e "\nDone! Check your transport broker rate enquiries page to see the new data."
echo "If you see any errors, make sure:"
echo "1. Your backend is running on port 3001"
echo "2. The transport routes and broker rate enquiries APIs are working"
echo "3. You're logged into the application"