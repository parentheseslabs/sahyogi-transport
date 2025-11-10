#!/bin/bash

# Script to add dummy enquiries
# Make sure your backend is running on port 3001
# You'll need to replace TOKEN with a valid authentication token

API_URL="http://localhost:3001"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3NjE5MDc4NDEsImV4cCI6MTc2MjUxMjY0MX0.vmtSRrAdmkbvDL2NLk-ZIz7ebzyHMIwDfBVwGkq1rqc"

if [ "$TOKEN" = "YOUR_TOKEN_HERE" ]; then
    echo "Please replace TOKEN with a valid authentication token"
    exit 1
fi

echo "Adding dummy enquiries..."

# Enquiry 1: Electronics shipment Mumbai to Delhi
curl -X POST "$API_URL/api/enquiries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "leadId": 1,
    "from": "Mumbai, Maharashtra",
    "to": "Delhi, NCR",
    "cargoType": "Electronics Equipment",
    "cargoWeight": 5.5,
    "remarks": "Fragile items, need careful handling",
    "source": "india_mart",
    "referrer": "IndiaMart Premium Lead"
  }'

# Enquiry 2: Textile shipment Ahmedabad to Bangalore
curl -X POST "$API_URL/api/enquiries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "leadId": 2,
    "from": "Ahmedabad, Gujarat",
    "to": "Bangalore, Karnataka",
    "cargoType": "Textile Goods",
    "cargoWeight": 12.0,
    "remarks": "Bulk shipment, standard packaging",
    "source": "just_dial",
    "referrer": "JustDial Business Directory"
  }'

# Enquiry 3: Machinery shipment Chennai to Kolkata
curl -X POST "$API_URL/api/enquiries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "leadId": 3,
    "from": "Chennai, Tamil Nadu",
    "to": "Kolkata, West Bengal",
    "cargoType": "Industrial Machinery",
    "cargoWeight": 25.0,
    "remarks": "Heavy machinery, crane required for loading/unloading",
    "source": "referral",
    "referrer": "Existing Client Reference"
  }'

# Enquiry 4: Food products shipment Pune to Hyderabad
curl -X POST "$API_URL/api/enquiries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "leadId": 4,
    "from": "Pune, Maharashtra",
    "to": "Hyderabad, Telangana",
    "cargoType": "Food Products",
    "cargoWeight": 8.5,
    "remarks": "Temperature controlled transport required",
    "source": "india_mart",
    "referrer": "IndiaMart Verified Supplier"
  }'

# Enquiry 5: Automobile parts shipment Gurgaon to Jaipur
curl -X POST "$API_URL/api/enquiries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "leadId": 5,
    "from": "Gurgaon, Haryana",
    "to": "Jaipur, Rajasthan",
    "cargoType": "Automobile Parts",
    "cargoWeight": 15.5,
    "remarks": "Multiple pickup points, consolidation required",
    "source": "referral",
    "referrer": "Industry Association"
  }'

# Enquiry 6: Pharmaceutical shipment Indore to Lucknow
curl -X POST "$API_URL/api/enquiries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "leadId": 6,
    "from": "Indore, Madhya Pradesh",
    "to": "Lucknow, Uttar Pradesh",
    "cargoType": "Pharmaceutical Products",
    "cargoWeight": 3.2,
    "remarks": "Time sensitive delivery, documentation important",
    "source": "unknown"
  }'

# Enquiry 7: Construction materials shipment Surat to Nagpur
curl -X POST "$API_URL/api/enquiries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "leadId": 7,
    "from": "Surat, Gujarat",
    "to": "Nagpur, Maharashtra",
    "cargoType": "Construction Materials",
    "cargoWeight": 35.0,
    "remarks": "Heavy load, open truck preferred",
    "source": "just_dial",
    "referrer": "JustDial Construction Directory"
  }'

# Enquiry 8: Chemicals shipment Vadodara to Raipur
curl -X POST "$API_URL/api/enquiries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "leadId": 8,
    "from": "Vadodara, Gujarat",
    "to": "Raipur, Chhattisgarh",
    "cargoType": "Chemical Products",
    "cargoWeight": 18.5,
    "remarks": "Hazardous material handling, special permits required",
    "source": "india_mart",
    "referrer": "IndiaMart Chemical Division"
  }'

# Enquiry 9: Furniture shipment Coimbatore to Kochi
curl -X POST "$API_URL/api/enquiries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "leadId": 1,
    "from": "Coimbatore, Tamil Nadu",
    "to": "Kochi, Kerala",
    "cargoType": "Furniture & Furnishings",
    "cargoWeight": 6.8,
    "remarks": "Wooden furniture, moisture protection needed",
    "source": "referral",
    "referrer": "Interior Design Partner"
  }'

# Enquiry 10: Steel products shipment Visakhapatnam to Bhubaneswar
curl -X POST "$API_URL/api/enquiries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "leadId": 2,
    "from": "Visakhapatnam, Andhra Pradesh",
    "to": "Bhubaneswar, Odisha",
    "cargoType": "Steel Products",
    "cargoWeight": 42.0,
    "remarks": "Heavy steel consignment, trailer truck required",
    "source": "unknown"
  }'

# Enquiry 11: Garments shipment Tirupur to Kanpur
curl -X POST "$API_URL/api/enquiries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "leadId": 3,
    "from": "Tirupur, Tamil Nadu",
    "to": "Kanpur, Uttar Pradesh",
    "cargoType": "Ready-made Garments",
    "cargoWeight": 9.2,
    "remarks": "Export quality garments, careful handling required",
    "source": "india_mart",
    "referrer": "Export Division"
  }'

# Enquiry 12: Agricultural products shipment Nashik to Patna
curl -X POST "$API_URL/api/enquiries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "leadId": 4,
    "from": "Nashik, Maharashtra",
    "to": "Patna, Bihar",
    "cargoType": "Agricultural Products",
    "cargoWeight": 22.0,
    "remarks": "Seasonal produce, quick delivery preferred",
    "source": "just_dial",
    "referrer": "Agricultural Traders Association"
  }'

echo -e "\nDone! Check your enquiries page to see the new data."
echo "If you see any errors, make sure:"
echo "1. Your backend is running on port 3001"
echo "2. You have valid leads in the database (lead IDs 1-8)"
echo "3. You're logged into the application"