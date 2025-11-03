#!/bin/bash

# Test script to issue multiple credentials and measure propagation latency
# This demonstrates the P2P networking and gossip protocol

echo "=== Credential Network Test Suite ==="
echo ""

# Wait for network to be ready
echo "Waiting for network to initialize (10 seconds)..."
sleep 10

echo ""
echo "--- Test 1: Issue credential from University A ---"
START_TIME=$(date +%s%3N)

curl -X POST http://localhost:3001/issue \
  -H "Content-Type: application/json" \
  -d '{
    "studentName": "Alice Johnson",
    "degree": "Bachelor of Computer Science",
    "graduationDate": "2024-05-15"
  }' | jq '.'

END_TIME=$(date +%s%3N)
LATENCY=$((END_TIME - START_TIME))
echo ""
echo "Issuance latency: ${LATENCY}ms"

echo ""
echo "Waiting for gossip propagation (3 seconds)..."
sleep 3

echo ""
echo "--- Test 2: Verify credential appears in all nodes ---"

echo ""
echo "University A ledger:"
curl -s http://localhost:3001/ledger | jq '.totalCredentials'

echo "University B ledger:"
curl -s http://localhost:3002/ledger | jq '.totalCredentials'

echo "Employer ledger:"
curl -s http://localhost:3003/ledger | jq '.totalCredentials'

echo "Relay ledger:"
curl -s http://localhost:3004/ledger | jq '.totalCredentials'

echo ""
echo "--- Test 3: Issue multiple credentials rapidly ---"

for i in {1..5}; do
  echo "Issuing credential $i..."
  curl -X POST http://localhost:3002/issue \
    -H "Content-Type: application/json" \
    -d "{
      \"studentName\": \"Student $i\",
      \"degree\": \"Master of Science\",
      \"graduationDate\": \"2024-12-01\"
    }" -s > /dev/null
done

echo ""
echo "Waiting for propagation (5 seconds)..."
sleep 5

echo ""
echo "--- Test 4: Final ledger counts (should show propagation) ---"

echo ""
echo "University A: $(curl -s http://localhost:3001/ledger | jq '.totalCredentials') credentials"
echo "University B: $(curl -s http://localhost:3002/ledger | jq '.totalCredentials') credentials"
echo "Employer: $(curl -s http://localhost:3003/ledger | jq '.totalCredentials') credentials"
echo "Relay: $(curl -s http://localhost:3004/ledger | jq '.totalCredentials') credentials"

echo ""
echo "--- Test 5: Network statistics ---"

echo ""
echo "University A peers:"
curl -s http://localhost:3001/stats | jq '.'

echo ""
echo "=== Test Complete ==="