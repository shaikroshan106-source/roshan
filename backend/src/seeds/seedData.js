import { firestoreService } from '../services/firestoreService.js';

export async function seedDatabase() {
  console.log('🌾 Initializing AGRIDIRECT complete 11-collection Firestore seed...');

  // 1. Seed `users`
  const existingUsers = await firestoreService.getAll('users');
  if (existingUsers.length === 0) {
    const seedUsers = [
      {
        uid: 'farmer_ravi',
        email: 'ravi.kumar@apfarms.in',
        phone: '+919876543210',
        name: 'Ravi Kumar',
        role: 'farmer',
        location: 'Vizag',
        state: 'Andhra Pradesh',
        status: 'active',
        preferredLanguage: 'te',
        createdAt: '2026-09-01T08:00:00.000Z',
        updatedAt: '2026-09-10T12:00:00.000Z',
      },
      {
        uid: 'buyer_srinivas',
        email: 'procurement@srinivasagro.com',
        phone: '+918765432109',
        name: 'Srinivas M.',
        role: 'buyer',
        location: 'Guntur',
        state: 'Andhra Pradesh',
        status: 'active',
        preferredLanguage: 'en',
        createdAt: '2026-09-02T09:00:00.000Z',
        updatedAt: '2026-09-10T12:00:00.000Z',
      },
      {
        uid: 'admin_user',
        email: 'admin@agridirect.com',
        phone: '+911111111111',
        name: 'Admin User',
        role: 'admin',
        location: 'AgriDirect HQ',
        state: 'Andhra Pradesh',
        status: 'active',
        preferredLanguage: 'en',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-09-10T12:00:00.000Z',
      },
      {
        uid: 'buyer_kiran',
        email: 'kiran@kirantraders.com',
        phone: '+919440188992',
        name: 'Kiran Traders',
        role: 'buyer',
        location: 'Tirupati',
        state: 'Andhra Pradesh',
        status: 'suspended',
        suspendedReason: 'Defaulted on escrow payment on ticket CMP-2026-9101',
        preferredLanguage: 'te',
        createdAt: '2026-09-04T10:00:00.000Z',
        updatedAt: '2026-09-05T15:00:00.000Z',
      }
    ];
    for (const u of seedUsers) {
      await firestoreService.set('users', u.uid, u);
    }
  }

  // 2. Seed `farmers`
  const existingFarmers = await firestoreService.getAll('farmers');
  if (existingFarmers.length === 0) {
    const seedFarmers = [
      {
        farmerId: 'farmer_ravi',
        aadhaarVerified: true,
        farmAddress: { village: 'Anandapuram', mandal: 'Bheemunipatnam', district: 'Visakhapatnam', pincode: '530052' },
        nearestMandi: 'Anandapuram Rythu Mandi',
        totalAcreage: 14.5,
        cropsCultivated: ['Tomato', 'Chilli', 'Rice'],
        totalLotsListed: 12,
        totalVolumeSold: 28500,
        totalRevenue: 245000,
        farmerRating: 4.9,
        createdAt: '2026-09-01T08:00:00.000Z',
        updatedAt: '2026-09-10T12:00:00.000Z',
      },
      {
        farmerId: 'farmer_lakshmi',
        aadhaarVerified: true,
        farmAddress: { village: 'Tenali Delta', mandal: 'Tenali', district: 'Guntur', pincode: '522201' },
        nearestMandi: 'Guntur Mirchi & Grain Mandi',
        totalAcreage: 22,
        cropsCultivated: ['Rice', 'Cotton', 'Maize'],
        totalLotsListed: 8,
        totalVolumeSold: 42000,
        totalRevenue: 512000,
        farmerRating: 4.8,
        createdAt: '2026-09-02T09:00:00.000Z',
        updatedAt: '2026-09-10T12:00:00.000Z',
      }
    ];
    for (const f of seedFarmers) {
      await firestoreService.set('farmers', f.farmerId, f);
    }
  }

  // 3. Seed `buyers`
  const existingBuyers = await firestoreService.getAll('buyers');
  if (existingBuyers.length === 0) {
    const seedBuyers = [
      {
        buyerId: 'buyer_srinivas',
        companyName: 'Srinivas Agro Exports Pvt Ltd',
        businessType: 'Exporter',
        gstin: '37AABCS1429B1Z8',
        verifiedBuyer: true,
        preferredCrops: ['Chilli', 'Cotton', 'Rice'],
        preferredGrades: ['A+', 'A'],
        maxBudget: 2500000,
        deliveryWarehouses: [
          { hubName: 'Guntur Export Depot', address: 'Plot 42, Auto Nagar', district: 'Guntur', pincode: '522001' }
        ],
        totalPurchases: 28,
        totalSpent: 850000,
        buyerRating: 4.8,
        createdAt: '2026-09-02T09:00:00.000Z',
        updatedAt: '2026-09-10T12:00:00.000Z',
      },
      {
        buyerId: 'buyer_krishna',
        companyName: 'Krishna Fresh Foods',
        businessType: 'Wholesaler',
        gstin: '37AAECK9928A1Z2',
        verifiedBuyer: true,
        preferredCrops: ['Tomato', 'Rice'],
        preferredGrades: ['A', 'B+'],
        maxBudget: 1000000,
        deliveryWarehouses: [
          { hubName: 'Vijayawada Central Mandi Cold Storage', address: 'NH-16 By-pass', district: 'Vijayawada', pincode: '520001' }
        ],
        totalPurchases: 19,
        totalSpent: 420000,
        buyerRating: 4.5,
        createdAt: '2026-09-03T10:00:00.000Z',
        updatedAt: '2026-09-10T12:00:00.000Z',
      }
    ];
    for (const b of seedBuyers) {
      await firestoreService.set('buyers', b.buyerId, b);
    }
  }

  // 4. Seed `products` (produce lots)
  const existingProducts = await firestoreService.getAll('products');
  if (existingProducts.length === 0) {
    const seedProducts = [
      {
        id: 'L001',
        farmerId: 'farmer_ravi',
        farmerName: 'Ravi Kumar',
        farmerPhone: '+91 98765 43210',
        crop: 'Tomato',
        variety: 'Vaishnavi Hybrid',
        quantity: 500,
        unit: 'kg',
        grade: 'A',
        quality: 'Premium Grade',
        moisture: 12,
        basePrice: 26,
        pricePerKg: 29.0,
        highestBid: 29.0,
        highestBidId: 'BID_003',
        totalBidsCount: 3,
        location: 'Vizag',
        imageUrl: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&q=75',
        aiInspection: { grade: 'A', confidence: 94, freshness: '96%', blemishFree: '98.2%', defectRate: '1.8%', inspectedAt: '10:15 AM', certificateId: 'AGRI-AI-829101' },
        description: 'Freshly harvested vine tomatoes from Anandapuram, Vizag. Grade A quality, sorted and packed in 25kg crates.',
        postedDate: '2026-09-02',
        endTime: '2026-09-16T18:00:00Z',
        status: 'active',
        createdAt: '2026-09-02T08:00:00.000Z',
        updatedAt: '2026-09-10T12:00:00.000Z',
      },
      {
        id: 'L002',
        farmerId: 'farmer_lakshmi',
        farmerName: 'Lakshmi Devi',
        farmerPhone: '+91 98480 12345',
        crop: 'Rice',
        variety: 'BPT 5204 (Sona Masoori)',
        quantity: 2000,
        unit: 'kg',
        grade: 'B+',
        quality: 'Good Quality',
        moisture: 14,
        basePrice: 30,
        pricePerKg: 33.0,
        highestBid: 33.0,
        highestBidId: 'BID_004',
        totalBidsCount: 1,
        location: 'Guntur',
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e8c7?w=400&q=75',
        aiInspection: { grade: 'B+', confidence: 87, freshness: '91%', blemishFree: '96.5%', defectRate: '3.5%', inspectedAt: '11:40 AM', certificateId: 'AGRI-AI-829102' },
        description: 'Sona Masoori raw paddy directly from Guntur delta farms. Excellent grain length and moisture under 14%.',
        postedDate: '2026-09-03',
        endTime: '2026-09-17T12:00:00Z',
        status: 'active',
        createdAt: '2026-09-03T09:00:00.000Z',
        updatedAt: '2026-09-10T12:00:00.000Z',
      },
      {
        id: 'L003',
        farmerId: 'farmer_ravi',
        farmerName: 'Ravi Kumar',
        farmerPhone: '+91 98765 43210',
        crop: 'Chilli',
        variety: 'Guntur Sannam S4',
        quantity: 800,
        unit: 'kg',
        grade: 'A+',
        quality: 'Export Grade',
        moisture: 10,
        basePrice: 58,
        pricePerKg: 64.0,
        highestBid: 64.0,
        highestBidId: 'BID_005',
        totalBidsCount: 1,
        location: 'Vizag',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75',
        aiInspection: { grade: 'A+', confidence: 96, freshness: '98%', blemishFree: '99.4%', defectRate: '0.6%', inspectedAt: '09:20 AM', certificateId: 'AGRI-AI-829103' },
        description: 'Deep red Guntur sannam variety chillies. High pungency, sun-dried, verified free of chemical residues.',
        postedDate: '2026-09-04',
        endTime: '2026-09-18T20:00:00Z',
        status: 'active',
        createdAt: '2026-09-04T10:00:00.000Z',
        updatedAt: '2026-09-10T12:00:00.000Z',
      },
      {
        id: 'L004',
        farmerId: 'farmer_pavan',
        farmerName: 'Pavan Reddy',
        farmerPhone: '+91 94401 56789',
        crop: 'Cotton',
        variety: 'Long Staple 32mm',
        quantity: 1500,
        unit: 'kg',
        grade: 'A',
        quality: 'Premium Long Staple',
        moisture: 8,
        basePrice: 65,
        pricePerKg: 72.0,
        highestBid: 72.0,
        highestBidId: 'BID_006',
        totalBidsCount: 1,
        location: 'Rajahmundry',
        imageUrl: 'https://images.unsplash.com/photo-1605000797498-6f2145b1d820?w=400&q=75',
        aiInspection: { grade: 'A', confidence: 91, freshness: '94%', blemishFree: '97.8%', defectRate: '2.2%', inspectedAt: '02:15 PM', certificateId: 'AGRI-AI-829104' },
        description: 'Clean medium-long staple cotton harvested this week in Godavari belt. Moisture certified at 8%.',
        postedDate: '2026-09-01',
        endTime: '2026-09-15T15:00:00Z',
        status: 'active',
        createdAt: '2026-09-01T07:00:00.000Z',
        updatedAt: '2026-09-10T12:00:00.000Z',
      }
    ];

    for (const p of seedProducts) {
      await firestoreService.set('products', p.id, p);
      // Mirror to listings collection for backward compatibility
      await firestoreService.set('listings', p.id, p);
    }
  }

  // 5. Seed `bids`
  const existingBids = await firestoreService.getAll('bids');
  if (existingBids.length === 0) {
    const seedBids = [
      { id: 'BID_001', productId: 'L001', lotId: 'L001', buyerId: 'buyer_krishna', buyer: 'Krishna Fresh Foods', buyerName: 'Krishna Fresh Foods', buyerPhone: '+91 98490 22334', amount: 27.5, totalOfferValue: 13750, status: 'outbid', timestamp: '10:32 AM', createdAt: '2026-09-02T10:32:00.000Z' },
      { id: 'BID_002', productId: 'L001', lotId: 'L001', buyerId: 'buyer_coastal', buyer: 'Coastal Agri Hub', buyerName: 'Coastal Agri Hub', buyerPhone: '+91 89781 44556', amount: 28.5, totalOfferValue: 14250, status: 'outbid', timestamp: '10:45 AM', createdAt: '2026-09-02T10:45:00.000Z' },
      { id: 'BID_003', productId: 'L001', lotId: 'L001', buyerId: 'buyer_andhra', buyer: 'Andhra Traders Pvt Ltd', buyerName: 'Andhra Traders Pvt Ltd', buyerPhone: '+91 78930 11223', amount: 29.0, totalOfferValue: 14500, status: 'highest', timestamp: '11:02 AM', createdAt: '2026-09-02T11:02:00.000Z' },
      { id: 'BID_004', productId: 'L002', lotId: 'L002', buyerId: 'buyer_delta', buyer: 'Delta Rice Millers', buyerName: 'Delta Rice Millers', buyerPhone: '+91 91234 56780', amount: 33.0, totalOfferValue: 66000, status: 'highest', timestamp: '09:15 AM', createdAt: '2026-09-03T09:15:00.000Z' },
      { id: 'BID_005', productId: 'L003', lotId: 'L003', buyerId: 'buyer_global', buyer: 'Global Spices Co.', buyerName: 'Global Spices Co.', buyerPhone: '+91 94411 98765', amount: 64.0, totalOfferValue: 51200, status: 'highest', timestamp: '11:30 AM', createdAt: '2026-09-04T11:30:00.000Z' },
      { id: 'BID_006', productId: 'L004', lotId: 'L004', buyerId: 'buyer_srinivas', buyer: 'Srinivas M.', buyerName: 'Srinivas M.', buyerPhone: '+91 87654 32109', amount: 72.0, totalOfferValue: 108000, status: 'highest', timestamp: '11:45 AM', createdAt: '2026-09-01T11:45:00.000Z' },
    ];
    for (const b of seedBids) {
      await firestoreService.set('bids', b.id, b);
    }
  }

  // 6. Seed `orders`
  const existingOrders = await firestoreService.getAll('orders');
  if (existingOrders.length === 0) {
    const seedOrders = [
      {
        id: 'ORD_2026_1001',
        productId: 'L003',
        bidId: 'BID_005',
        farmerId: 'farmer_ravi',
        farmerName: 'Ravi Kumar',
        buyerId: 'buyer_srinivas',
        buyerName: 'Srinivas Agro Exports Pvt Ltd',
        crop: 'Chilli',
        quantity: 800,
        unit: 'kg',
        unitPrice: 64.0,
        subtotalAmount: 51200,
        logisticsFee: 1800,
        platformFee: 512,
        totalAmount: 53512,
        orderStatus: 'completed',
        escrowStatus: 'released_to_farmer',
        logisticsProvider: 'Coastal Freight Logistics',
        truckNumber: 'AP 31 TJ 9204',
        deliveryAddress: { hubName: 'Guntur Export Depot', address: 'Plot 42, Auto Nagar', district: 'Guntur', pincode: '522001' },
        completedAt: '2026-09-05T16:00:00.000Z',
        createdAt: '2026-09-04T12:00:00.000Z',
        updatedAt: '2026-09-05T16:00:00.000Z',
      }
    ];
    for (const o of seedOrders) {
      await firestoreService.set('orders', o.id, o);
    }
  }

  // 7. Seed `transactions`
  const existingTxns = await firestoreService.getAll('transactions');
  if (existingTxns.length === 0) {
    const seedTxns = [
      {
        id: 'TXN_1725450001',
        orderId: 'ORD_2026_1001',
        payerId: 'buyer_srinivas',
        payerName: 'Srinivas Agro Exports Pvt Ltd',
        payeeId: 'agridirect_escrow',
        payeeName: 'AgriDirect Instant Escrow',
        type: 'escrow_deposit',
        amount: 53512,
        currency: 'INR',
        paymentGateway: 'Razorpay',
        gatewayRefId: 'pay_Hj92019a8bc',
        status: 'settled',
        settledAt: '2026-09-04T12:10:00.000Z',
        createdAt: '2026-09-04T12:05:00.000Z',
      },
      {
        id: 'TXN_1725530002',
        orderId: 'ORD_2026_1001',
        payerId: 'agridirect_escrow',
        payerName: 'AgriDirect Instant Escrow',
        payeeId: 'farmer_ravi',
        payeeName: 'Ravi Kumar',
        type: 'farmer_payout',
        amount: 51200,
        currency: 'INR',
        paymentGateway: 'UPI',
        gatewayRefId: 'upi_ref_9281048102',
        status: 'settled',
        settledAt: '2026-09-05T16:05:00.000Z',
        createdAt: '2026-09-05T16:00:00.000Z',
      }
    ];
    for (const t of seedTxns) {
      await firestoreService.set('transactions', t.id, t);
    }
  }

  // 8. Seed `reports` (farmer & buyer reports)
  const existingReports = await firestoreService.getAll('reports');
  if (existingReports.length === 0) {
    const seedReports = [
      {
        id: 'REP_FARMER_1725610001',
        reportType: 'farmer_harvest_forecast',
        authorId: 'farmer_ravi',
        authorRole: 'farmer',
        title: 'Kharif Harvest Yield & Quality Forecast - Visakhapatnam',
        region: 'Vizag',
        crop: 'Tomato',
        data: {
          cultivatedAcreage: 6,
          projectedYieldKg: 18000,
          expectedHarvestDate: '2026-09-25',
          aiQualityGrade: 'A',
          estimatedRevenue: 540000,
        },
        published: true,
        createdAt: '2026-09-08T09:00:00.000Z',
      },
      {
        id: 'REP_BUYER_1725610002',
        reportType: 'buyer_procurement_summary',
        authorId: 'buyer_srinivas',
        authorRole: 'buyer',
        title: 'Monthly Procurement Demand Bulletin - Guntur Mandi',
        region: 'Guntur',
        crop: 'Chilli',
        data: {
          targetProcurementTons: 120,
          acceptedGrades: ['A+', 'A'],
          offeredPriceRange: '₹62 - ₹68 / kg',
          escrowReleaseSLA: 'Within 2 hours of weighbridge receipt',
        },
        published: true,
        createdAt: '2026-09-07T11:00:00.000Z',
      }
    ];
    for (const r of seedReports) {
      await firestoreService.set('reports', r.id, r);
    }
  }

  // 9. Seed `complaints`
  const existingComplaints = await firestoreService.getAll('complaints');
  if (existingComplaints.length === 0) {
    const seedComplaints = [
      {
        id: 'CMP-2026-9101',
        reporterId: 'farmer_ravi',
        reporterName: 'Ravi Kumar',
        reporterRole: 'Farmer',
        reporterPhone: '+91 98480 22331',
        reporterEmail: 'ravi.kumar@apfarms.in',
        category: 'Delayed / Defaulted Payment from Buyer',
        counterpartyName: 'Krishna Fresh Foods',
        lotId: 'L001',
        severity: 'High',
        description: 'Delivered 500 kg Grade-A Tomatoes to Krishna Fresh Foods warehouse in Vijayawada 4 days ago. Payment of ₹15,250 is still pending beyond the agreed 24-hour instant escrow release.',
        status: 'Pending',
        submittedDate: '2026-09-05 14:30',
        adminNote: '',
        counterpartySuspended: false,
        createdAt: '2026-09-05T14:30:00.000Z',
        updatedAt: '2026-09-05T14:30:00.000Z',
      },
      {
        id: 'CMP-2026-9102',
        reporterId: 'buyer_srinivas',
        reporterName: 'Srinivas Agro Exports',
        reporterRole: 'Buyer',
        reporterPhone: '+91 94401 88992',
        reporterEmail: 'procurement@srinivasagro.com',
        category: 'Quality Discrepancy / Spoiled Produce',
        counterpartyName: 'Suresh Babu',
        lotId: 'L003',
        severity: 'Medium',
        description: 'Received Chilli lot listed as Grade A+ with 10% moisture, but lab sample test showed 16.5% moisture with surface discolouration on 8% of bags. Requesting quality adjustment.',
        status: 'Under Investigation',
        submittedDate: '2026-09-04 11:15',
        adminNote: 'Admin team assigned field inspector in Vizianagaram mandi to re-check moisture level.',
        counterpartySuspended: false,
        createdAt: '2026-09-04T11:15:00.000Z',
        updatedAt: '2026-09-04T14:00:00.000Z',
      },
      {
        id: 'CMP-2026-9103',
        reporterId: 'farmer_lakshmi',
        reporterName: 'Lakshmi Devi',
        reporterRole: 'Farmer',
        reporterPhone: '+91 97012 44556',
        reporterEmail: 'lakshmi.d@farms.in',
        category: 'Logistics & Transport Delay',
        counterpartyName: 'Coastal Freight Logistics',
        lotId: 'L002',
        severity: 'Low',
        description: 'Truck arrived 5 hours late for pickup in Guntur, requiring extra labor overtime charges of ₹600.',
        status: 'Resolved',
        submittedDate: '2026-09-02 09:45',
        adminNote: 'Logistics provider refunded ₹600 compensation to farmer account on Sep 3.',
        counterpartySuspended: false,
        createdAt: '2026-09-02T09:45:00.000Z',
        updatedAt: '2026-09-03T10:00:00.000Z',
      },
    ];
    for (const cmp of seedComplaints) {
      await firestoreService.set('complaints', cmp.id, cmp);
    }
  }

  // 10. Seed `market_prices`
  const existingPrices = await firestoreService.getAll('market_prices');
  if (existingPrices.length === 0) {
    const seedPrices = [
      {
        id: 'Tomato_Vizag_2026-09-10',
        crop: 'Tomato',
        mandi: 'Vizag',
        date: '2026-09-10',
        minPrice: 26.0,
        maxPrice: 32.0,
        modalPrice: 29.0,
        trend: 'rising',
        confidence: 94,
        weeklyForecast: [
          { day: 'Mon', price: 29.0 },
          { day: 'Tue', price: 29.5 },
          { day: 'Wed', price: 30.5 },
          { day: 'Thu', price: 31.0 },
          { day: 'Fri', price: 31.8 },
          { day: 'Sat', price: 32.5 },
          { day: 'Sun', price: 33.0 },
        ],
        recommendation: 'WAIT & SELL — price may rise ₹3–₹4/kg in 3–5 days',
        updatedAt: '2026-09-10T06:00:00.000Z',
      },
      {
        id: 'Chilli_Guntur_2026-09-10',
        crop: 'Chilli',
        mandi: 'Guntur',
        date: '2026-09-10',
        minPrice: 58.0,
        maxPrice: 66.0,
        modalPrice: 64.0,
        trend: 'rising',
        confidence: 96,
        weeklyForecast: [
          { day: 'Mon', price: 64.0 },
          { day: 'Tue', price: 65.0 },
          { day: 'Wed', price: 66.2 },
          { day: 'Thu', price: 67.0 },
          { day: 'Fri', price: 68.5 },
          { day: 'Sat', price: 69.0 },
          { day: 'Sun', price: 70.0 },
        ],
        recommendation: 'HOLD — export festival demand surging next week',
        updatedAt: '2026-09-10T06:00:00.000Z',
      },
      {
        id: 'Rice_Vijayawada_2026-09-10',
        crop: 'Rice',
        mandi: 'Vijayawada',
        date: '2026-09-10',
        minPrice: 31.0,
        maxPrice: 35.0,
        modalPrice: 33.0,
        trend: 'stable',
        confidence: 89,
        weeklyForecast: [
          { day: 'Mon', price: 33.0 },
          { day: 'Tue', price: 33.0 },
          { day: 'Wed', price: 33.2 },
          { day: 'Thu', price: 33.5 },
          { day: 'Fri', price: 33.5 },
          { day: 'Sat', price: 34.0 },
          { day: 'Sun', price: 34.0 },
        ],
        recommendation: 'SELL NOW — stable prices with high procurement volume',
        updatedAt: '2026-09-10T06:00:00.000Z',
      }
    ];
    for (const p of seedPrices) {
      await firestoreService.set('market_prices', p.id, p);
    }
  }

  // 11. Seed `notifications`
  const existingNotifs = await firestoreService.getAll('notifications');
  if (existingNotifs.length === 0) {
    const seedNotifs = [
      {
        id: 'NOTIF_001',
        userId: 'farmer_ravi',
        type: 'NEW_BID',
        title: 'New Bid on Tomato Lot',
        message: 'Krishna Fresh Foods placed an offer of ₹29.0/kg on your 500kg Tomato lot.',
        metadata: { lotId: 'L001', bidId: 'BID_003', amount: 29.0 },
        read: false,
        createdAt: '2026-09-02T11:02:00.000Z',
      },
      {
        id: 'NOTIF_002',
        userId: 'buyer_srinivas',
        type: 'BID_ACCEPTED',
        title: 'Deal Confirmed for Chilli!',
        message: 'Farmer Ravi Kumar accepted your offer of ₹64/kg for 800kg Chilli. Order ORD_2026_1001 created.',
        metadata: { orderId: 'ORD_2026_1001', lotId: 'L003' },
        read: false,
        createdAt: '2026-09-04T12:00:00.000Z',
      }
    ];
    for (const n of seedNotifs) {
      await firestoreService.set('notifications', n.id, n);
    }
  }

  console.log('✅ Seed completed: all 11 collections populated successfully.');
}
