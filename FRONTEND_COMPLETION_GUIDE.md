# REE Frontend Completion Guide

## ✅ COMPLETED (Production-Ready)

### 1. **Authentication System** (100%)
   - Login page with animations
   - Password change with validation
   - JWT token management
   - Auto-refresh on token expiry
   - Protected routes

### 2. **UI Components** (100%)
   - Button (with loading states & variants)
   - StatCard (KPI cards with icons)
   - LoadingSpinner
   - EmptyState
   - Modal (with Headless UI)
   - Badge (status indicators)

### 3. **Dashboard** (100%)
   - 4 KPI cards with live data
   - Interactive Pie Chart (coverage by district)
   - Interactive Bar Chart (readings per agent)
   - Interactive Line Chart (consumption evolution)
   - Summary table
   - Full Recharts integration

### 4. **User Management** (100% - SUPERADMIN)
   - List users with search & filters
   - Create user + auto password generation
   - Edit user
   - Delete user
   - Reset password
   - Full CRUD with modal forms

## 🚧 REMAINING PAGES (Use UserManagement as Template)

### Template Pattern (Copy from UserManagement.tsx)

Every page follows this structure:

```typescript
// 1. State management
const [data, setData] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const [filters, setFilters] = useState({});

// 2. Data fetching
useEffect(() => fetchData(), []);
const fetchData = async () => {
  try {
    const response = await axios.get('/endpoint');
    setData(response.data);
  } catch (error) {
    toast.error('Error message');
  } finally {
    setIsLoading(false);
  }
};

// 3. CRUD operations
const handleCreate = async (formData) => { /* POST */ };
const handleUpdate = async (id, formData) => { /* PUT */ };
const handleDelete = async (id) => { /* DELETE */ };

// 4. Render
if (isLoading) return <LoadingSpinner />;
return (
  <div>
    {/* Header + Action Buttons */}
    {/* Filters */}
    {/* Table/List */}
    {/* Modals */}
  </div>
);
```

---

## 📝 Page-by-Page Implementation Guide

### 5. **Readings List** (`/readings`)

**API Endpoint**: `GET /api/readings`

**Features Needed**:
- Table with columns: Date, Agent, Address, Type, Consumption
- Filters: Date picker, District dropdown, Agent dropdown, Type toggle
- Sort: By date (default DESC)
- Pagination
- Export CSV button
- Click row → navigate to detail

**Code Pattern**:
```typescript
const [readings, setReadings] = useState<Reading[]>([]);
const [filters, setFilters] = useState({
  page: 1,
  limit: 20,
  date: '',
  districtId: '',
  agentId: '',
  meterType: '',
});

const fetchReadings = async () => {
  const params = new URLSearchParams(filters);
  const response = await axios.get(`/readings?${params}`);
  setReadings(response.data.readings);
  setPagination(response.data.pagination);
};

const handleExport = async () => {
  const params = new URLSearchParams(filters);
  const response = await axios.get(`/readings/export?${params}`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'releves.csv');
  document.body.appendChild(link);
  link.click();
};
```

**Components Needed**:
- Date picker (use `<input type="date">`)
- District/Agent dropdowns (fetch from API)
- Pagination component
- Table with hover effects

---

### 6. **Reading Detail** (`/readings/:id`)

**API Endpoint**: `GET /api/readings/:id`

**Features Needed**:
- Display all reading info (read-only)
- Agent name with avatar
- Complete address
- Meter ID with copy-to-clipboard
- Meter type badge
- Previous/Current index
- Calculated consumption (highlighted)
- Back button

**Code Pattern**:
```typescript
const { id } = useParams();
const [reading, setReading] = useState<Reading | null>(null);

useEffect(() => {
  fetchReading();
}, [id]);

const fetchReading = async () => {
  const response = await axios.get(`/readings/${id}`);
  setReading(response.data);
};

const handleCopyMeterId = () => {
  navigator.clipboard.writeText(reading.meter.meterId);
  toast.success('ID copié!');
};
```

---

### 7. **Agents List** (`/agents`)

**API Endpoint**: `GET /api/agents`

**Features Needed**:
- Table: Name, Phone (personal + pro), District
- Filter by district
- Sort by name (default ASC)
- Search functionality
- Click row → navigate to detail

**Code Pattern**: Same as UserManagement, but simpler (no create/edit/delete)

---

### 8. **Agent Detail** (`/agents/:id`)

**API Endpoint**:
- `GET /api/agents/:id`
- `GET /api/agents/:id/performance?period=3months`
- `PUT /api/agents/:id` (district assignment)

**Features Needed**:
- Display agent info (name, phones) - READ ONLY
- **Editable** district dropdown
- Save button for district
- Performance metrics: Avg readings/day (large number)
- **Interactive graph**: Line chart showing "readings per day" over time
- **Time period slider**: 1 week, 1 month, 3 months, 6 months, 1 year
- Back button

**Code Pattern**:
```typescript
const [agent, setAgent] = useState(null);
const [performance, setPerformance] = useState(null);
const [period, setPeriod] = useState('3months');
const [selectedDistrict, setSelectedDistrict] = useState('');

useEffect(() => {
  fetchAgent();
  fetchPerformance();
}, [id, period]);

const fetchPerformance = async () => {
  const response = await axios.get(`/agents/${id}/performance?period=${period}`);
  setPerformance(response.data);
};

const handleSaveDistrict = async () => {
  await axios.put(`/agents/${id}`, { districtId: selectedDistrict });
  toast.success('Quartier modifié');
  fetchAgent();
};

// Render Recharts LineChart with performance.dailyReadings
```

---

### 9. **Meters List** (`/meters`)

**API Endpoint**: `GET /api/meters`

**Features Needed**:
- Table: Meter ID, Address
- Search by ID or address
- Filter by district
- Pagination
- "Add Meter" button (prominent)
- Click row → navigate to detail

**Code Pattern**: Same as Readings List with pagination

---

### 10. **Meter Detail** (`/meters/:id`)

**API Endpoint**: `GET /api/meters/:id`

**Features Needed**:
- Display meter ID, address, client ID, current index, last reading date
- **Reading History Table**: Last 10 readings
  - Columns: Date, Agent, Index, Consumption
- "More Details" button → redirect to `/readings?meterId=:id`

**Code Pattern**:
```typescript
const [meter, setMeter] = useState(null);

const fetchMeter = async () => {
  const response = await axios.get(`/meters/${id}`);
  setMeter(response.data); // includes recentReadings
};

const handleViewAllReadings = () => {
  navigate(`/readings?meterId=${id}`);
};
```

---

### 11. **Add Meter** (`/meters/add`)

**API Endpoint**:
- `GET /api/meters/available-addresses?districtId=&meterType=`
- `POST /api/meters`

**Features Needed**:
- **Step 1**: Select meter type (Water/Electricity) - Radio buttons with icons
- **Step 2**: Select address - Button opens modal
  - Modal shows addresses WITHOUT meters of selected type
  - Filter by district
  - Search field (real-time filter)
  - Selectable list items
- Save button
- Meter ID auto-generated on save

**Code Pattern**:
```typescript
const [meterType, setMeterType] = useState<MeterType | null>(null);
const [selectedAddress, setSelectedAddress] = useState(null);
const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
const [availableAddresses, setAvailableAddresses] = useState([]);

const fetchAvailableAddresses = async () => {
  const params = new URLSearchParams({
    meterType: meterType!,
    districtId: districtFilter,
  });
  const response = await axios.get(`/meters/available-addresses?${params}`);
  setAvailableAddresses(response.data);
};

const handleSubmit = async () => {
  await axios.post('/meters', {
    addressId: selectedAddress.id,
    meterType,
  });
  toast.success('Compteur créé!');
  navigate('/meters');
};

// Modal with searchable address list
```

---

### 12. **Reports** (`/reports`)

**API Endpoints**:
- `GET /api/reports/monthly-readings?startDate=&endDate=`
- `GET /api/reports/consumption-evolution?startDate=&endDate=`

**Features Needed**:
- Two report cards:
  1. **Monthly Readings Report**
     - Description
     - Date range selector (start/end date)
     - "Generate PDF" button
  2. **Consumption Evolution Report**
     - Description
     - Date range selector
     - "Generate PDF" button

**Code Pattern**:
```typescript
const [dateRange, setDateRange] = useState({
  startDate: '',
  endDate: '',
});

const handleGenerateMonthlyReport = async () => {
  const params = new URLSearchParams(dateRange);
  const response = await axios.get(`/reports/monthly-readings?${params}`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'rapport-releves-mensuels.pdf');
  document.body.appendChild(link);
  link.click();
  toast.success('Rapport téléchargé!');
};

// Same for consumption report
```

---

## 🎯 Quick Start Guide

### 1. Copy Pattern from UserManagement

```bash
# Example for Readings List
cp frontend/src/pages/users/UserManagement.tsx frontend/src/pages/readings/ReadingsList.tsx

# Update imports and types
# Replace User with Reading
# Replace /users with /readings
# Adjust table columns
# Add filters
```

### 2. Test With Backend

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev

# Open http://localhost:5173
# Login: admin@ree.ma / Admin@123
```

### 3. Use These Resources

- **API Docs**: See README.md for all endpoints
- **Types**: See `frontend/src/types/index.ts`
- **UI Components**: Use Button, Modal, LoadingSpinner, etc.
- **Axios Instance**: Import from `lib/axios` (auto token refresh)
- **Toasts**: Import `toast` from `react-hot-toast`
- **Icons**: Import from `lucide-react`
- **Charts**: Import from `recharts`

---

## 📦 Components You Have

```typescript
// Buttons
<Button onClick={fn}>Text</Button>
<Button variant="secondary">Text</Button>
<Button variant="danger">Text</Button>
<Button isLoading={true}>Loading...</Button>

// Cards
<StatCard title="Title" value="123" icon={IconName} color="primary" />

// Status
<Badge variant="success">Active</Badge>
<LoadingSpinner />
<EmptyState title="No data" description="..." action={<Button>...</Button>} />

// Modal
<Modal isOpen={isOpen} onClose={fn} title="Title" size="lg">
  {children}
</Modal>
```

---

## 🚀 Estimated Time

- **Readings List + Detail**: 2-3 hours
- **Agents List + Detail**: 2-3 hours
- **Meters List + Detail + Add**: 3-4 hours
- **Reports**: 1-2 hours

**Total**: ~10-12 hours to complete all remaining pages

---

## 💡 Tips

1. **Copy-paste is your friend**: UserManagement is the perfect template
2. **Test incrementally**: Build one page, test it, then move to next
3. **Use the seeded data**: Backend has sample data ready
4. **Check browser console**: API errors will show there
5. **Use React DevTools**: Inspect state and props
6. **Responsive design**: Test on mobile (Chrome DevTools)

---

## ✅ Quality Checklist (For Each Page)

- [ ] Loading state shown while fetching
- [ ] Empty state when no data
- [ ] Error handling with toasts
- [ ] Form validation (if applicable)
- [ ] Responsive design
- [ ] Animations with Framer Motion
- [ ] Proper TypeScript types
- [ ] Clean code with comments
- [ ] Tested CRUD operations
- [ ] No console errors

---

**You're almost there! The hard part (backend + auth + dashboard) is done. Just replicate the UserManagement pattern and you'll have a complete production app!** 🎉
