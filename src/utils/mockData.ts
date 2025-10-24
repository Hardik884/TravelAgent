export const mockBudgetData = {
  total: 50000,
  breakdown: [
    { name: 'Flights', value: 15000, percentage: 30 },
    { name: 'Hotels', value: 20000, percentage: 40 },
    { name: 'Activities', value: 7500, percentage: 15 },
    { name: 'Food', value: 5000, percentage: 10 },
    { name: 'Misc', value: 2500, percentage: 5 },
  ],
};

export const mockHotels = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `${['Grand', 'Royal', 'Luxury', 'Paradise', 'Ocean View', 'Mountain', 'City', 'Sunset'][i % 8]} ${['Hotel', 'Resort', 'Inn', 'Suites', 'Palace'][i % 5]}`,
  price: Math.floor(Math.random() * 15000) + 2000,
  rating: (Math.random() * 2 + 3).toFixed(1),
  image: `https://images.pexels.com/photos/${[271624, 258154, 271619, 338504, 189296, 161758, 164595, 210265][i % 8]}/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600`,
  tag: ['Adventure Friendly', 'Luxury Pick', 'Budget Friendly', 'Family Friendly', 'Cultural Experience'][i % 5],
  location: ['Downtown', 'Beach Front', 'Mountain View', 'City Center', 'Near Airport'][i % 5],
}));

export const mockTransportOptions = [
  {
    mode: 'Flight',
    icon: '✈️',
    duration: '2h 30m',
    priceRange: '₹8,000 - ₹15,000',
    note: 'Fastest',
    options: [
      { carrier: 'Air India', time: '09:00 AM', price: 12000 },
      { carrier: 'IndiGo', time: '02:30 PM', price: 10500 },
      { carrier: 'SpiceJet', time: '06:45 PM', price: 9500 },
    ],
  },
  {
    mode: 'Train',
    icon: '🚆',
    duration: '12h 15m',
    priceRange: '₹2,000 - ₹5,000',
    note: 'Most Comfortable',
    options: [
      { carrier: 'Rajdhani Express', time: '08:00 PM', price: 3500 },
      { carrier: 'Shatabdi Express', time: '06:00 AM', price: 2800 },
    ],
  },
  {
    mode: 'Bus',
    icon: '🚌',
    duration: '15h 30m',
    priceRange: '₹800 - ₹2,000',
    note: 'Cheapest',
    options: [
      { carrier: 'Volvo AC', time: '10:00 PM', price: 1500 },
      { carrier: 'Sleeper', time: '09:30 PM', price: 900 },
    ],
  },
  {
    mode: 'Cab',
    icon: '🚖',
    duration: '8h 45m',
    priceRange: '₹6,000 - ₹10,000',
    note: 'Most Flexible',
    options: [
      { carrier: 'Ola Prime', time: 'Anytime', price: 8500 },
      { carrier: 'Uber XL', time: 'Anytime', price: 7800 },
    ],
  },
];

export const mockItinerary = [
  {
    day: 1,
    activities: [
      { name: 'Check-in & Hotel Exploration', icon: '🏨', time: '12:00 PM', cost: 0, description: 'Settle into your hotel and explore the amenities' },
      { name: 'Local Market Visit', icon: '🛍️', time: '04:00 PM', cost: 500, description: 'Explore local markets and try street food' },
      { name: 'Welcome Dinner', icon: '🍽️', time: '07:30 PM', cost: 1500, description: 'Traditional cuisine at a popular restaurant' },
    ],
  },
  {
    day: 2,
    activities: [
      { name: 'Heritage Site Tour', icon: '🏛️', time: '09:00 AM', cost: 2000, description: 'Guided tour of historical monuments' },
      { name: 'Lunch at Iconic Cafe', icon: '☕', time: '01:00 PM', cost: 800, description: 'Local favorites and specialty dishes' },
      { name: 'Adventure Activity', icon: '🧗‍♂️', time: '03:30 PM', cost: 3500, description: 'Zip-lining, trekking, or water sports' },
    ],
  },
  {
    day: 3,
    activities: [
      { name: 'Nature Trail', icon: '🏞️', time: '07:00 AM', cost: 1000, description: 'Scenic hiking trail with panoramic views' },
      { name: 'Cultural Performance', icon: '🎭', time: '06:00 PM', cost: 1200, description: 'Traditional dance and music show' },
      { name: 'Rooftop Dining', icon: '🌃', time: '08:30 PM', cost: 2000, description: 'Dinner with city skyline views' },
    ],
  },
];

export const tripTypes = [
  { value: 'luxurious', label: 'Luxurious' },
  { value: 'adventurous', label: 'Adventurous' },
  { value: 'family', label: 'Family' },
  { value: 'budget', label: 'Budget' },
  { value: 'cultural', label: 'Cultural' },
];
