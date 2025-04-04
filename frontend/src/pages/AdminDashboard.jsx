import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  BarChart3, 
  Users, 
  Settings, 
  LogOut, 
  MessageSquare,
  Search,
  Trash2,
  UserX,
  UserCheck,
  Bell,
  Shield,
  ChevronDown,
  Loader2,
  AlertCircle,
  Eye,
  Download,
  ArrowUpDown,
  ClipboardList,
  BarChart,
  AlertTriangle,
  FileText,
  Activity,
  Zap,
  Database,
  Server,
  MessageCircle,
  Flag,
  CheckSquare,
  UserPlus,
  UserCog,
  Users as UsersGroup,
  Globe,
  Sliders,
  Megaphone,
  CheckCircle,
  Clock,
  Calendar,
  HelpCircle,
  PieChart,
  LayoutGrid,
  Edit,
  Plus,
  Filter,
  InfoIcon,
  X,
  MailIcon,
  Send,
  Copy
} from 'lucide-react';

// Helper function to determine if a URL is a GIF
const isGifImage = (url) => {
  if (!url) return false;
  return url.toLowerCase().endsWith('.gif');
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    offlineUsers: 0,
    recentUsers: []
  });
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [messageAnalytics, setMessageAnalytics] = useState(null);
  const [messageAnalyticsLoading, setMessageAnalyticsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        await Promise.all([
          fetchDashboardStats(),
          fetchUsers()
        ]);
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        if (error.response?.status === 401) {
          navigate('/admin/login');
        }
      }
    };

    initializeDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'messageAnalytics' && !messageAnalytics) {
      fetchMessageAnalytics();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!loading) {
      fetchUsers();
    }
  }, [currentPage, sortField, sortOrder, filterStatus]);

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      console.log('Fetching dashboard stats...');
      
      const res = await axios.get('/api/admin/dashboard/stats', {
        withCredentials: true
      });
      
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      if (error.response?.status === 401) {
        navigate('/admin/login');
      }
      toast.error('Failed to load dashboard stats');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      params.append('page', currentPage);
      if (search) params.append('search', search);
      if (sortField) params.append('sort', sortField);
      if (sortOrder) params.append('order', sortOrder);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      
      const res = await axios.get(`/api/admin/users?${params.toString()}`, {
        withCredentials: true
      });
      
      setUsers(res.data.users);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
      if (error.response?.status === 401) {
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleStatusUpdate = async (userId, newStatus) => {
    try {
      await axios.patch(`/api/admin/users/${userId}/status`, { status: newStatus });
      toast.success(`User ${newStatus} successfully`);
      fetchUsers();
      fetchDashboardStats();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await axios.delete(`/api/admin/users/${userId}`);
      toast.success('User deleted successfully');
      fetchUsers();
      fetchDashboardStats();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to desc order for new field
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleFilter = (status) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const exportUserData = () => {
    try {
      // Create CSV content
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Add headers
      csvContent += "Name,Email,Status,Last Seen,Joined Date\n";
      
      // Add user data
      users.forEach(user => {
        const lastSeen = user.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'Never';
        const joinedDate = new Date(user.createdAt).toLocaleDateString();
        const row = [
          user.fullName,
          user.email,
          user.status || 'active',
          lastSeen,
          joinedDate
        ].join(',');
        csvContent += row + "\n";
      });
      
      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      
      // Download file
      link.click();
      document.body.removeChild(link);
      
      toast.success('User data exported successfully');
    } catch (error) {
      console.error('Error exporting users:', error);
      toast.error('Failed to export user data');
    }
  };

  const generateReport = async () => {
    try {
      setReportLoading(true);
      
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create a simple HTML report
      const reportContent = `
        <html>
          <head>
            <title>User Report - ${new Date().toLocaleDateString()}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              h1 { color: #333; }
              table { border-collapse: collapse; width: 100%; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .summary { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 5px; }
            </style>
          </head>
          <body>
            <h1>User Analytics Report</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            
            <div class="summary">
              <h2>Summary</h2>
              <p>Total Users: ${stats.totalUsers}</p>
              <p>Online Users: ${stats.onlineUsers}</p>
              <p>Offline Users: ${stats.offlineUsers}</p>
            </div>
            
            <h2>User Details</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                ${users.map(user => `
                  <tr>
                    <td>${user.fullName}</td>
                    <td>${user.email}</td>
                    <td>${user.status || 'active'}</td>
                    <td>${user.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'Never'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
      
      // Create a Blob and download
      const blob = new Blob([reportContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user_report_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setReportLoading(false);
    }
  };

  const viewUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserDetailModal(true);
  };

  // User Detail Modal Component
  const UserDetailModal = ({ user, onClose }) => {
    if (!user) return null;
    
    // Helper function to get status description
    const getStatusDescription = (status) => {
      switch(status) {
        case 'active':
          return 'User account is active and can access all features';
        case 'suspended':
          return 'User account is temporarily suspended and cannot login';
        case 'blocked':
          return 'User account is blocked due to policy violations and cannot login';
        default:
          return 'Unknown status';
      }
    };
    
    // Helper function to get badge color
    const getStatusBadgeClass = (status) => {
      switch(status) {
        case 'active': return 'badge-success';
        case 'suspended': return 'badge-warning';
        case 'blocked': return 'badge-error';
        default: return 'badge-ghost';
      }
    };
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-base-100 rounded-lg w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">User Details</h3>
            <button onClick={onClose} className="btn btn-sm btn-circle">✕</button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex-shrink-0">
              <div className="avatar">
                <div className="w-24 h-24 rounded-full">
                  <img src={user.profilePic || '/avatar.png'} alt="" />
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{user.fullName}</h2>
              <p className="text-base-content/60">{user.email}</p>
              <div className="mt-2">
                <span className={`badge ${getStatusBadgeClass(user.status || 'active')}`}>
                  {user.status || 'active'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="divider"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Account Information</h4>
              <ul className="space-y-2">
                <li><span className="text-base-content/60">Joined:</span> {new Date(user.createdAt).toLocaleString()}</li>
                <li><span className="text-base-content/60">Last Seen:</span> {user.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'Never'}</li>
                <li>
                  <span className="text-base-content/60">Status:</span> 
                  <span className={`ml-1 font-medium ${
                    user.status === 'active' ? 'text-success' : 
                    user.status === 'suspended' ? 'text-warning' : 'text-error'
                  }`}>
                    {user.status || 'active'}
                  </span>
                </li>
                <li><span className="text-base-content/60">Online:</span> {user.isOnline ? 'Yes' : 'No'}</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Activity</h4>
              <ul className="space-y-2">
                <li><span className="text-base-content/60">Messages:</span> {user.messageCount || 0}</li>
                <li><span className="text-base-content/60">Logins:</span> {user.loginCount || 0}</li>
              </ul>
            </div>
          </div>
          
          {/* Status description alert */}
          <div className={`alert ${
            user.status === 'active' ? 'alert-success' : 
            user.status === 'suspended' ? 'alert-warning' : 
            user.status === 'blocked' ? 'alert-error' : 'alert-info'
          } mt-4 text-sm`}>
            <AlertCircle className="w-4 h-4" />
            <span>{getStatusDescription(user.status || 'active')}</span>
          </div>
          
          <div className="divider"></div>
          
          <div className="flex justify-end gap-2 mt-4">
            {user.status === 'active' && (
              <>
                <button
                  onClick={() => {
                    handleStatusUpdate(user._id, 'suspended');
                    onClose();
                  }}
                  className="btn btn-warning btn-sm"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Suspend
                </button>
                <button
                  onClick={() => {
                    handleStatusUpdate(user._id, 'blocked');
                    onClose();
                  }}
                  className="btn btn-error btn-sm"
                >
                  <UserX className="w-4 h-4 mr-2" />
                  Block
                </button>
              </>
            )}
            
            {user.status === 'suspended' && (
              <button
                onClick={() => {
                  handleStatusUpdate(user._id, 'active');
                  onClose();
                }}
                className="btn btn-success btn-sm"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Reactivate
              </button>
            )}
            
            {user.status === 'blocked' && (
              <button
                onClick={() => {
                  handleStatusUpdate(user._id, 'active');
                  onClose();
                }}
                className="btn btn-success btn-sm"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Unblock
              </button>
            )}
            
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this user?')) {
                  handleDeleteUser(user._id);
                  onClose();
                }
              }}
              className="btn btn-error btn-sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/admin/logout');
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const fetchMessageAnalytics = async () => {
    try {
      setMessageAnalyticsLoading(true);
      console.log('Fetching message analytics...');
      
      const res = await axios.get('/api/admin/dashboard/message-analytics', {
        withCredentials: true
      });
      
      setMessageAnalytics(res.data);
    } catch (error) {
      console.error('Error fetching message analytics:', error);
      if (error.response?.status === 401) {
        navigate('/admin/login');
      }
      toast.error('Failed to load message analytics');
    } finally {
      setMessageAnalyticsLoading(false);
    }
  };

  if (loading && statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-base-content/70 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-base-200">
      {/* Sidebar */}
      <div className="w-64 bg-base-100 border-r border-base-300 hidden md:block">
        <div className="h-16 flex items-center px-6 border-b border-base-300">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-lg font-bold">Admin Panel</h1>
          </div>
        </div>
        <nav className="py-4 overflow-y-auto max-h-[calc(100vh-4rem)]">
          <div className="px-4 py-2 text-xs font-semibold text-base-content/60 uppercase tracking-wider">
            Main
          </div>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium ${
              activeTab === 'dashboard' 
                ? 'text-primary bg-primary/10' 
                : 'text-base-content/70 hover:bg-base-200'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium ${
              activeTab === 'users' 
                ? 'text-primary bg-primary/10' 
                : 'text-base-content/70 hover:bg-base-200'
            }`}
          >
            <Users className="w-5 h-5" />
            Users
          </button>
          
          {/* New Analytics Category */}
          <div className="px-4 py-2 mt-2 text-xs font-semibold text-base-content/60 uppercase tracking-wider">
            Analytics
          </div>
          <button 
            onClick={() => setActiveTab('messageAnalytics')}
            className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium ${
              activeTab === 'messageAnalytics' 
                ? 'text-primary bg-primary/10' 
                : 'text-base-content/70 hover:bg-base-200'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            Message Analytics
          </button>
          <button 
            onClick={() => setActiveTab('systemHealth')}
            className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium ${
              activeTab === 'systemHealth' 
                ? 'text-primary bg-primary/10' 
                : 'text-base-content/70 hover:bg-base-200'
            }`}
          >
            <Activity className="w-5 h-5" />
            System Health
          </button>
          
          {/* New Management Category */}
          <div className="px-4 py-2 mt-2 text-xs font-semibold text-base-content/60 uppercase tracking-wider">
            Management
          </div>
          <button 
            onClick={() => setActiveTab('groupManagement')}
            className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium ${
              activeTab === 'groupManagement' 
                ? 'text-primary bg-primary/10' 
                : 'text-base-content/70 hover:bg-base-200'
            }`}
          >
            <UsersGroup className="w-5 h-5" />
            Group Management
          </button>
          <button 
            onClick={() => setActiveTab('contentModeration')}
            className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium ${
              activeTab === 'contentModeration' 
                ? 'text-primary bg-primary/10' 
                : 'text-base-content/70 hover:bg-base-200'
            }`}
          >
            <Flag className="w-5 h-5" />
            Content Moderation
          </button>
          <button 
            onClick={() => setActiveTab('userVerification')}
            className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium ${
              activeTab === 'userVerification' 
                ? 'text-primary bg-primary/10' 
                : 'text-base-content/70 hover:bg-base-200'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            User Verification
          </button>
          <button 
            onClick={() => setActiveTab('notificationCenter')}
            className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium ${
              activeTab === 'notificationCenter' 
                ? 'text-primary bg-primary/10' 
                : 'text-base-content/70 hover:bg-base-200'
            }`}
          >
            <Megaphone className="w-5 h-5" />
            Notification Center
          </button>
          
          <div className="px-4 py-2 mt-2 text-xs font-semibold text-base-content/60 uppercase tracking-wider">
            Settings
          </div>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium ${
              activeTab === 'settings' 
                ? 'text-primary bg-primary/10' 
                : 'text-base-content/70 hover:bg-base-200'
            }`}
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-6 py-3 text-sm font-medium text-error hover:bg-base-200"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </nav>
      </div>

      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-base-100 border-b border-base-300 flex items-center justify-between px-4 md:hidden z-10">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-lg font-bold">Admin</h1>
        </div>
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
            <ChevronDown />
          </div>
          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
            <li onClick={() => setActiveTab('dashboard')}><a className={activeTab === 'dashboard' ? 'active' : ''}>Dashboard</a></li>
            <li onClick={() => setActiveTab('users')}><a className={activeTab === 'users' ? 'active' : ''}>Users</a></li>
            <li className="menu-title"><span>Analytics</span></li>
            <li onClick={() => setActiveTab('messageAnalytics')}><a className={activeTab === 'messageAnalytics' ? 'active' : ''}>Message Analytics</a></li>
            <li onClick={() => setActiveTab('systemHealth')}><a className={activeTab === 'systemHealth' ? 'active' : ''}>System Health</a></li>
            <li className="menu-title"><span>Management</span></li>
            <li onClick={() => setActiveTab('groupManagement')}><a className={activeTab === 'groupManagement' ? 'active' : ''}>Group Management</a></li>
            <li onClick={() => setActiveTab('contentModeration')}><a className={activeTab === 'contentModeration' ? 'active' : ''}>Content Moderation</a></li>
            <li onClick={() => setActiveTab('userVerification')}><a className={activeTab === 'userVerification' ? 'active' : ''}>User Verification</a></li>
            <li onClick={() => setActiveTab('notificationCenter')}><a className={activeTab === 'notificationCenter' ? 'active' : ''}>Notification Center</a></li>
            <li className="menu-title"><span>Settings</span></li>
            <li onClick={() => setActiveTab('settings')}><a className={activeTab === 'settings' ? 'active' : ''}>Settings</a></li>
            <li onClick={handleLogout}><a className="text-error">Logout</a></li>
          </ul>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-6 px-4 md:px-6 mt-16 md:mt-0">
          {activeTab === 'dashboard' && (
            <>
              <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-6">
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div className="ml-4">
                        <h3 className="card-title text-base-content/70">Total Users</h3>
                        {statsLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <p className="text-2xl font-semibold text-primary mt-1">{stats.totalUsers}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="size-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-success" />
                      </div>
                      <div className="ml-4">
                        <h3 className="card-title text-base-content/70">Online Users</h3>
                        {statsLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <p className="text-2xl font-semibold text-success mt-1">{stats.onlineUsers}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="size-10 rounded-lg bg-base-content/10 flex items-center justify-center">
                        <UserX className="w-5 h-5 text-base-content" />
                      </div>
                      <div className="ml-4">
                        <h3 className="card-title text-base-content/70">Offline Users</h3>
                        {statsLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <p className="text-2xl font-semibold text-base-content mt-1">{stats.offlineUsers}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Recent Users */}
              <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body">
                  <h3 className="card-title flex items-center gap-2 mb-4">
                    <Bell className="w-5 h-5" />
                    Recent User Activity
                  </h3>
                  
                  {statsLoading ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : stats.recentUsers?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="table table-zebra w-full">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Status</th>
                            <th>Joined</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentUsers.map((user) => (
                            <tr key={user._id}>
                              <td className="flex items-center gap-3">
                                <div className="avatar">
                                  <div className={`w-10 h-10 rounded-full ${isGifImage(user.profilePic) ? 'overflow-hidden' : ''}`}>
                                    <img 
                                      src={user.profilePic || '/avatar.png'} 
                                      alt=""
                                      className={isGifImage(user.profilePic) ? 'object-cover' : ''}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <div className="font-bold">{user.fullName}</div>
                                  <div className="text-sm opacity-50">{user.email}</div>
                                </div>
                              </td>
                              <td>
                                <div className={`badge ${user.isOnline ? 'badge-success' : 'badge-ghost'}`}>
                                  {user.isOnline ? 'Online' : 'Offline'}
                                </div>
                              </td>
                              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6">
                      <AlertCircle className="w-12 h-12 text-base-content/30 mb-2" />
                      <p className="text-base-content/60">No recent users found</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <>
              <h2 className="text-2xl font-bold mb-6">User Management</h2>
              
              {/* Search and Actions Row */}
              <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body">
                  <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
                    <form onSubmit={handleSearch} className="w-full md:w-auto md:min-w-[320px]">
                      <div className="relative w-full">
                        <input
                          type="text"
                          placeholder="Search users..."
                          className="input input-bordered w-full pr-10"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                        <button 
                          type="submit" 
                          className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle"
                          disabled={loading}
                        >
                          {loading ? 
                            <Loader2 className="h-4 w-4 animate-spin text-primary" /> : 
                            <Search className="h-4 w-4 text-primary" />
                          }
                        </button>
                      </div>
                    </form>
                    
                    <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                      <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-outline btn-sm">
                          <ArrowUpDown className="h-4 w-4" />
                          <span className="ml-1">Sort</span>
                        </div>
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                          <li onClick={() => handleSort('fullName')}>
                            <a className={sortField === 'fullName' ? 'active' : ''}>
                              Name {sortField === 'fullName' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </a>
                          </li>
                          <li onClick={() => handleSort('email')}>
                            <a className={sortField === 'email' ? 'active' : ''}>
                              Email {sortField === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </a>
                          </li>
                          <li onClick={() => handleSort('status')}>
                            <a className={sortField === 'status' ? 'active' : ''}>
                              Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </a>
                          </li>
                          <li onClick={() => handleSort('lastSeen')}>
                            <a className={sortField === 'lastSeen' ? 'active' : ''}>
                              Last Seen {sortField === 'lastSeen' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </a>
                          </li>
                          <li onClick={() => handleSort('createdAt')}>
                            <a className={sortField === 'createdAt' ? 'active' : ''}>
                              Join Date {sortField === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </a>
                          </li>
                        </ul>
                      </div>
                      <button onClick={exportUserData} className="btn btn-outline btn-sm">
                        <Download className="h-4 w-4" />
                        <span className="ml-1">Export</span>
                      </button>
                      <button 
                        onClick={generateReport} 
                        className="btn btn-primary btn-sm"
                        disabled={reportLoading}
                      >
                        {reportLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                        <span className="ml-1">Report</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Users Table */}
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="card-title flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      All Users
                    </h3>
                    <div className="flex gap-2">
                      <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-sm btn-ghost">
                          Filter <ChevronDown className="w-4 h-4" />
                        </div>
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                          <li onClick={() => handleFilter('all')}><a className={filterStatus === 'all' ? 'active' : ''}>All Users</a></li>
                          <li onClick={() => handleFilter('active')}><a className={filterStatus === 'active' ? 'active' : ''}>Active Users</a></li>
                          <li onClick={() => handleFilter('blocked')}><a className={filterStatus === 'blocked' ? 'active' : ''}>Blocked Users</a></li>
                          <li onClick={() => handleFilter('suspended')}><a className={filterStatus === 'suspended' ? 'active' : ''}>Suspended Users</a></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {loading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                  ) : users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <AlertCircle className="w-16 h-16 text-base-content/30 mb-4" />
                      <p className="text-base-content/60 text-lg">No users found</p>
                      <p className="text-base-content/40 text-sm mt-2">Try adjusting your search criteria</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="table table-zebra w-full">
                          <thead>
                            <tr>
                              <th>
                                <div className="flex items-center gap-1">
                                  User <ArrowUpDown className="w-3 h-3" />
                                </div>
                              </th>
                              <th>Status</th>
                              <th>Last Seen</th>
                              <th className="text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map((user) => (
                              <tr key={user._id}>
                                <td className="flex items-center gap-3">
                                  <div className="avatar">
                                    <div className={`w-10 h-10 rounded-full ${isGifImage(user.profilePic) ? 'overflow-hidden' : ''}`}>
                                      <img 
                                        src={user.profilePic || '/avatar.png'} 
                                        alt=""
                                        className={isGifImage(user.profilePic) ? 'object-cover' : ''}
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <div className="font-bold">{user.fullName}</div>
                                    <div className="text-sm opacity-50">{user.email}</div>
                                  </div>
                                </td>
                                <td>
                                  <div className={`badge ${
                                    user.status === 'active' ? 'badge-success' : 
                                    user.status === 'suspended' ? 'badge-warning' : 'badge-error'
                                  }`}>
                                    {user.status || 'active'}
                                  </div>
                                </td>
                                <td>
                                  {user.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'Never'}
                                </td>
                                <td>
                                  <div className="flex justify-end gap-1">
                                    <button
                                      onClick={() => viewUserDetails(user)}
                                      className="btn btn-sm btn-ghost tooltip"
                                      data-tip="View Details"
                                    >
                                      <Eye className="w-4 h-4 text-primary" />
                                    </button>
                                    <button
                                      className="btn btn-sm btn-ghost tooltip"
                                      data-tip="Generate Report"
                                    >
                                      <BarChart className="w-4 h-4 text-primary" />
                                    </button>
                                    {user.status === 'active' && (
                                      <>
                                        <button
                                          onClick={() => handleStatusUpdate(user._id, 'suspended')}
                                          className="btn btn-sm btn-ghost tooltip"
                                          data-tip="Suspend User"
                                        >
                                          <AlertTriangle className="w-4 h-4 text-warning" />
                                        </button>
                                        <button
                                          onClick={() => handleStatusUpdate(user._id, 'blocked')}
                                          className="btn btn-sm btn-ghost tooltip"
                                          data-tip="Block User"
                                        >
                                          <UserX className="w-4 h-4 text-error" />
                                        </button>
                                      </>
                                    )}
                                    {user.status === 'suspended' && (
                                      <>
                                        <button
                                          onClick={() => handleStatusUpdate(user._id, 'active')}
                                          className="btn btn-sm btn-ghost tooltip"
                                          data-tip="Reactivate User"
                                        >
                                          <UserCheck className="w-4 h-4 text-success" />
                                        </button>
                                        <button
                                          onClick={() => handleStatusUpdate(user._id, 'blocked')}
                                          className="btn btn-sm btn-ghost tooltip"
                                          data-tip="Block User"
                                        >
                                          <UserX className="w-4 h-4 text-error" />
                                        </button>
                                      </>
                                    )}
                                    {user.status === 'blocked' && (
                                      <button
                                        onClick={() => handleStatusUpdate(user._id, 'active')}
                                        className="btn btn-sm btn-ghost tooltip"
                                        data-tip="Unblock User"
                                      >
                                        <UserCheck className="w-4 h-4 text-success" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeleteUser(user._id)}
                                      className="btn btn-sm btn-ghost tooltip"
                                      data-tip="Delete User"
                                    >
                                      <Trash2 className="w-4 h-4 text-error" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      <div className="flex items-center justify-between mt-6">
                        <button
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          className="btn btn-sm"
                          disabled={currentPage === 1 || loading}
                        >
                          Previous
                        </button>
                        <div className="join">
                          {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                            const page = i + 1;
                            return (
                              <button 
                                key={page}
                                className={`join-item btn btn-sm ${currentPage === page ? 'btn-active' : ''}`}
                                onClick={() => setCurrentPage(page)}
                                disabled={loading}
                              >
                                {page}
                              </button>
                            );
                          })}
                          {totalPages > 5 && (
                            <button className="join-item btn btn-sm btn-disabled">...</button>
                          )}
                        </div>
                        <button
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          className="btn btn-sm"
                          disabled={currentPage === totalPages || loading}
                        >
                          Next
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
          
          {activeTab === 'settings' && (
            <>
              <h2 className="text-2xl font-bold mb-6">System Settings</h2>
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h3 className="card-title flex items-center gap-2 mb-4">
                    <Settings className="w-5 h-5" />
                    Admin Settings
                  </h3>
                  
                  <div className="alert alert-info mb-6">
                    <div className="flex items-center gap-2">
                      <span>This feature is coming soon. Check back later for more admin settings.</span>
                    </div>
                  </div>
                  
                  <div className="form-control w-full max-w-md mb-4">
                    <label className="label">
                      <span className="label-text font-medium">Chat Message Retention (days)</span>
                    </label>
                    <input type="number" className="input input-bordered" value="30" disabled />
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">Control how long messages are kept in the system</span>
                    </label>
                  </div>
                  
                  <div className="form-control w-full max-w-md mb-4">
                    <label className="label">
                      <span className="label-text font-medium">Allow New Registrations</span>
                    </label>
                    <input type="checkbox" className="toggle toggle-primary" checked disabled />
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">Enable or disable new user registrations</span>
                    </label>
                  </div>
                  
                  <div className="form-control w-full max-w-md">
                    <label className="label">
                      <span className="label-text font-medium">Maintenance Mode</span>
                    </label>
                    <input type="checkbox" className="toggle toggle-error" disabled />
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">Put the application in maintenance mode</span>
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}
          
          {/* Message Analytics Tab */}
          {activeTab === 'messageAnalytics' && (
            <>
              <h2 className="text-2xl font-bold mb-6">Message Analytics</h2>
              
              {messageAnalyticsLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : messageAnalytics ? (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-6">
                    <div className="card bg-base-100 shadow-sm">
                      <div className="card-body">
                        <div className="flex items-center">
                          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-primary" />
                          </div>
                          <div className="ml-4">
                            <h3 className="card-title text-base-content/70">Total Messages</h3>
                            <p className="text-2xl font-semibold text-primary mt-1">{messageAnalytics.summary.totalMessages.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="card bg-base-100 shadow-sm">
                      <div className="card-body">
                        <div className="flex items-center">
                          <div className="size-10 rounded-lg bg-success/10 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-success" />
                          </div>
                          <div className="ml-4">
                            <h3 className="card-title text-base-content/70">Today's Messages</h3>
                            <p className="text-2xl font-semibold text-success mt-1">{messageAnalytics.summary.todayMessages.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="card bg-base-100 shadow-sm">
                      <div className="card-body">
                        <div className="flex items-center">
                          <div className="size-10 rounded-lg bg-warning/10 flex items-center justify-center">
                            <UsersGroup className="w-5 h-5 text-warning" />
                          </div>
                          <div className="ml-4">
                            <h3 className="card-title text-base-content/70">Group Messages</h3>
                            <p className="text-2xl font-semibold text-warning mt-1">{messageAnalytics.summary.groupMessages.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="card bg-base-100 shadow-sm">
                      <div className="card-body">
                        <div className="flex items-center">
                          <div className="size-10 rounded-lg bg-info/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-info" />
                          </div>
                          <div className="ml-4">
                            <h3 className="card-title text-base-content/70">Direct Messages</h3>
                            <p className="text-2xl font-semibold text-info mt-1">{messageAnalytics.summary.directMessages.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Message Volume Chart */}
                  <div className="card bg-base-100 shadow-sm mb-6">
                    <div className="card-body">
                      <h3 className="card-title flex items-center gap-2 mb-4">
                        <BarChart className="w-5 h-5" />
                        Message Volume (Last 30 Days)
                      </h3>
                      
                      <div className="relative w-full h-80 overflow-hidden rounded-lg bg-base-200/50 flex items-center justify-center">
                        <div className="w-full h-full px-4 pt-4">
                          {/* Real Chart with actual data */}
                          <div className="w-full h-full flex items-end justify-between gap-1">
                            {messageAnalytics.messageVolume.map((day, i) => {
                              // Find the max count to calculate relative heights
                              const maxCount = Math.max(...messageAnalytics.messageVolume.map(d => d.count));
                              const height = (day.count / maxCount) * 90; // Max 90% of container height
                              
                              return (
                                <div key={i} className="relative group h-full flex-1">
                                  <div 
                                    className={`w-full bg-primary hover:bg-primary-focus transition-all duration-200`}
                                    style={{ height: `${height}%` }}
                                  ></div>
                                  <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-base-300 text-base-content px-2 py-1 rounded text-xs whitespace-nowrap transition-opacity">
                                    {day.count} messages<br />
                                    {new Date(day._id).toLocaleDateString()}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-2 flex justify-between text-xs text-base-content/60">
                            <span>30 days ago</span>
                            <span>Today</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Message Analytics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Top Active Hours */}
                    <div className="card bg-base-100 shadow-sm">
                      <div className="card-body">
                        <h3 className="card-title flex items-center gap-2 mb-4">
                          <Clock className="w-5 h-5" />
                          Peak Usage Hours
                        </h3>
                        
                        <div className="overflow-x-auto">
                          <table className="table table-zebra w-full">
                            <thead>
                              <tr>
                                <th>Time (24h)</th>
                                <th>Messages</th>
                                <th>% of Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {messageAnalytics.peakHours.map((hour, index) => (
                                <tr key={index}>
                                  <td className="font-medium">{hour.hour}</td>
                                  <td>{hour.count.toLocaleString()}</td>
                                  <td>
                                    <div className="flex items-center gap-2">
                                      <div className="w-full bg-base-200 rounded-full h-2.5">
                                        <div 
                                          className="bg-primary h-2.5 rounded-full" 
                                          style={{ width: `${hour.percentage}%` }}
                                        ></div>
                                      </div>
                                      <span>{hour.percentage}%</span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                    
                    {/* Message Types Distribution */}
                    <div className="card bg-base-100 shadow-sm">
                      <div className="card-body">
                        <h3 className="card-title flex items-center gap-2 mb-4">
                          <PieChart className="w-5 h-5" />
                          Message Types
                        </h3>
                        
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-primary"></div>
                                <span className="font-medium">Text Messages</span>
                              </div>
                              <span>{messageAnalytics.messageTypes.text.percentage}%</span>
                            </div>
                            <div className="w-full bg-base-200 rounded-full h-2.5">
                              <div 
                                className="bg-primary h-2.5 rounded-full" 
                                style={{ width: `${messageAnalytics.messageTypes.text.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-secondary"></div>
                                <span className="font-medium">Image Messages</span>
                              </div>
                              <span>{messageAnalytics.messageTypes.image.percentage}%</span>
                            </div>
                            <div className="w-full bg-base-200 rounded-full h-2.5">
                              <div 
                                className="bg-secondary h-2.5 rounded-full" 
                                style={{ width: `${messageAnalytics.messageTypes.image.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-accent"></div>
                                <span className="font-medium">Voice Messages</span>
                              </div>
                              <span>{messageAnalytics.messageTypes.voice.percentage}%</span>
                            </div>
                            <div className="w-full bg-base-200 rounded-full h-2.5">
                              <div 
                                className="bg-accent h-2.5 rounded-full" 
                                style={{ width: `${messageAnalytics.messageTypes.voice.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-info"></div>
                                <span className="font-medium">Video Messages</span>
                              </div>
                              <span>{messageAnalytics.messageTypes.video.percentage}%</span>
                            </div>
                            <div className="w-full bg-base-200 rounded-full h-2.5">
                              <div 
                                className="bg-info h-2.5 rounded-full" 
                                style={{ width: `${messageAnalytics.messageTypes.video.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-warning"></div>
                                <span className="font-medium">Other Files</span>
                              </div>
                              <span>{messageAnalytics.messageTypes.other.percentage}%</span>
                            </div>
                            <div className="w-full bg-base-200 rounded-full h-2.5">
                              <div 
                                className="bg-warning h-2.5 rounded-full" 
                                style={{ width: `${messageAnalytics.messageTypes.other.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Top Active Groups/Users */}
                  <div className="card bg-base-100 shadow-sm mb-6">
                    <div className="card-body">
                      <h3 className="card-title flex items-center gap-2 mb-4">
                        <UsersGroup className="w-5 h-5" />
                        Most Active Groups
                      </h3>
                      
                      <div className="overflow-x-auto">
                        <table className="table table-zebra w-full">
                          <thead>
                            <tr>
                              <th>Group</th>
                              <th>Members</th>
                              <th>Messages (30d)</th>
                              <th>Avg. Per Day</th>
                              <th>Trend</th>
                            </tr>
                          </thead>
                          <tbody>
                            {messageAnalytics.activeGroups.map((group, index) => (
                              <tr key={group._id}>
                                <td className="font-medium">
                                  <div className="flex items-center gap-3">
                                    <div className="avatar">
                                      <div className="w-10 h-10 rounded-full bg-primary/20">
                                        <span className="text-center w-full text-primary font-bold flex items-center justify-center h-full">
                                          {group.name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
                                        </span>
                                      </div>
                                    </div>
                                    <span>{group.name}</span>
                                  </div>
                                </td>
                                <td>{group.memberCount}</td>
                                <td>{group.messageCount.toLocaleString()}</td>
                                <td>{group.avgPerDay}</td>
                                <td className={group.trend > 0 ? 'text-success' : group.trend < 0 ? 'text-error' : 'text-warning'}>
                                  {group.trend > 0 ? '+' : ''}{group.trend}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  
                  {/* Export Features */}
                  <div className="flex gap-4 justify-end mt-6">
                    <button 
                      className="btn btn-outline btn-sm gap-2"
                      onClick={exportUserData}
                    >
                      <Download size={16} />
                      Export as CSV
                    </button>
                    <button 
                      className="btn btn-primary btn-sm gap-2"
                      onClick={generateReport}
                      disabled={reportLoading}
                    >
                      {reportLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileText size={16} />
                      )}
                      Generate Report
                    </button>
                  </div>
                </>
              ) : (
                <div className="card bg-base-100 shadow-sm p-6">
                  <p>Failed to load message analytics. <button className="btn btn-sm btn-outline" onClick={fetchMessageAnalytics}>Try Again</button></p>
                </div>
              )}
            </>
          )}
          
          {/* System Health Tab */}
          {activeTab === 'systemHealth' && (
            <>
              <h2 className="text-2xl font-bold mb-6">System Health Monitoring</h2>
              
              {/* Status Overview */}
              <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body">
                  <h3 className="card-title flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5" />
                    System Status
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-base-200/50 p-4 rounded-lg flex flex-col items-center">
                      <div className="radial-progress text-success" style={{"--value": 97, "--size": "8rem"}} role="progressbar">97%</div>
                      <span className="font-medium mt-2">API Uptime</span>
                      <span className="text-xs text-base-content/60">Last 30 days</span>
                    </div>
                    
                    <div className="bg-base-200/50 p-4 rounded-lg flex flex-col items-center">
                      <div className="radial-progress text-warning" style={{"--value": 82, "--size": "8rem"}} role="progressbar">82%</div>
                      <span className="font-medium mt-2">CPU Usage</span>
                      <span className="text-xs text-base-content/60">Current load</span>
                    </div>
                    
                    <div className="bg-base-200/50 p-4 rounded-lg flex flex-col items-center">
                      <div className="radial-progress text-info" style={{"--value": 68, "--size": "8rem"}} role="progressbar">68%</div>
                      <span className="font-medium mt-2">Memory Usage</span>
                      <span className="text-xs text-base-content/60">Total: 32GB</span>
                    </div>
                    
                    <div className="bg-base-200/50 p-4 rounded-lg flex flex-col items-center">
                      <div className="radial-progress text-primary" style={{"--value": 42, "--size": "8rem"}} role="progressbar">42%</div>
                      <span className="font-medium mt-2">Storage Usage</span>
                      <span className="text-xs text-base-content/60">Total: 1TB</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Response Time Chart */}
              <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body">
                  <h3 className="card-title flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5" />
                    API Response Time (ms)
                  </h3>
                  
                  <div className="relative w-full h-80 overflow-hidden rounded-lg bg-base-200/50 flex items-center justify-center">
                    <div className="w-full h-full px-4 pt-4">
                      {/* Mock Chart - In a real app, use a chart library */}
                      <div className="w-full h-full relative">
                        {/* Line Chart Background Grid */}
                        <div className="absolute inset-0 grid grid-cols-6 grid-rows-4">
                          {Array.from({ length: 24 }).map((_, i) => (
                            <div key={i} className="border-t border-l border-base-300"></div>
                          ))}
                        </div>
                        
                        {/* Line Chart Visual */}
                        <svg className="w-full h-full" viewBox="0 0 600 240" preserveAspectRatio="none">
                          <path
                            d="M0,180 C20,160 40,150 60,140 C80,130 100,180 120,170 C140,160 160,120 180,110 C200,100 220,120 240,130 C260,140 280,130 300,120 C320,110 340,90 360,80 C380,70 400,60 420,50 C440,40 460,80 480,90 C500,100 520,80 540,70 C560,60 580,40 600,20"
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M0,180 C20,160 40,150 60,140 C80,130 100,180 120,170 C140,160 160,120 180,110 C200,100 220,120 240,130 C260,140 280,130 300,120 C320,110 340,90 360,80 C380,70 400,60 420,50 C440,40 460,80 480,90 C500,100 520,80 540,70 C560,60 580,40 600,20"
                            fill="url(#gradient)"
                            fillOpacity="0.2"
                            stroke="none"
                          />
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-base-content/60">
                        <span>00:00</span>
                        <span>04:00</span>
                        <span>08:00</span>
                        <span>12:00</span>
                        <span>16:00</span>
                        <span>20:00</span>
                        <span>Now</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Active Servers and Database Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Server Status */}
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body">
                    <h3 className="card-title flex items-center gap-2 mb-4">
                      <Server className="w-5 h-5" />
                      Server Status
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="table table-zebra w-full">
                        <thead>
                          <tr>
                            <th>Server</th>
                            <th>Status</th>
                            <th>Load</th>
                            <th>Uptime</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-success"></div>
                                <span>API-Server-001</span>
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-success">Online</span>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <div className="w-full bg-base-200 rounded-full h-2.5">
                                  <div className="bg-success h-2.5 rounded-full" style={{ width: '42%' }}></div>
                                </div>
                                <span className="text-xs">42%</span>
                              </div>
                            </td>
                            <td>21d 14h 32m</td>
                          </tr>
                          <tr>
                            <td className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-success"></div>
                                <span>API-Server-002</span>
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-success">Online</span>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <div className="w-full bg-base-200 rounded-full h-2.5">
                                  <div className="bg-success h-2.5 rounded-full" style={{ width: '38%' }}></div>
                                </div>
                                <span className="text-xs">38%</span>
                              </div>
                            </td>
                            <td>21d 14h 32m</td>
                          </tr>
                          <tr>
                            <td className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-warning"></div>
                                <span>Storage-Server-001</span>
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-warning">High Load</span>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <div className="w-full bg-base-200 rounded-full h-2.5">
                                  <div className="bg-warning h-2.5 rounded-full" style={{ width: '87%' }}></div>
                                </div>
                                <span className="text-xs">87%</span>
                              </div>
                            </td>
                            <td>15d 22h 45m</td>
                          </tr>
                          <tr>
                            <td className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-error"></div>
                                <span>Backup-Server-001</span>
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-error">Offline</span>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <div className="w-full bg-base-200 rounded-full h-2.5">
                                  <div className="bg-error h-2.5 rounded-full" style={{ width: '0%' }}></div>
                                </div>
                                <span className="text-xs">0%</span>
                              </div>
                            </td>
                            <td>Offline for 2h 18m</td>
                          </tr>
                          <tr>
                            <td className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-success"></div>
                                <span>WebSocket-Server</span>
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-success">Online</span>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <div className="w-full bg-base-200 rounded-full h-2.5">
                                  <div className="bg-success h-2.5 rounded-full" style={{ width: '52%' }}></div>
                                </div>
                                <span className="text-xs">52%</span>
                              </div>
                            </td>
                            <td>14d 8h 12m</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                
                {/* Database Status */}
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body">
                    <h3 className="card-title flex items-center gap-2 mb-4">
                      <Database className="w-5 h-5" />
                      Database Status
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="table table-zebra w-full">
                        <thead>
                          <tr>
                            <th>Database</th>
                            <th>Status</th>
                            <th>Size</th>
                            <th>Connections</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-success"></div>
                                <span>Users DB</span>
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-success">Healthy</span>
                            </td>
                            <td>1.8 GB</td>
                            <td>42 active</td>
                          </tr>
                          <tr>
                            <td className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-success"></div>
                                <span>Messages DB</span>
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-success">Healthy</span>
                            </td>
                            <td>24.6 GB</td>
                            <td>78 active</td>
                          </tr>
                          <tr>
                            <td className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-warning"></div>
                                <span>Media DB</span>
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-warning">Warning</span>
                            </td>
                            <td>156.2 GB</td>
                            <td>36 active</td>
                          </tr>
                          <tr>
                            <td className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-success"></div>
                                <span>Groups DB</span>
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-success">Healthy</span>
                            </td>
                            <td>3.4 GB</td>
                            <td>28 active</td>
                          </tr>
                          <tr>
                            <td className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-success"></div>
                                <span>Analytics DB</span>
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-success">Healthy</span>
                            </td>
                            <td>8.7 GB</td>
                            <td>12 active</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* System Alerts */}
              <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body">
                  <h3 className="card-title flex items-center gap-2 mb-4">
                    <Bell className="w-5 h-5" />
                    System Alerts
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="alert alert-error">
                      <AlertCircle className="w-5 h-5" />
                      <div>
                        <h3 className="font-bold">Critical Alert</h3>
                        <div className="text-xs">Backup-Server-001 is offline. Automated failover initiated. Manual intervention may be required.</div>
                      </div>
                      <button className="btn btn-sm">View</button>
                    </div>
                    
                    <div className="alert alert-warning">
                      <AlertTriangle className="w-5 h-5" />
                      <div>
                        <h3 className="font-bold">Warning</h3>
                        <div className="text-xs">Storage-Server-001 is experiencing high CPU load (87%). Consider scaling resources.</div>
                      </div>
                      <button className="btn btn-sm">View</button>
                    </div>
                    
                    <div className="alert alert-warning">
                      <AlertTriangle className="w-5 h-5" />
                      <div>
                        <h3 className="font-bold">Warning</h3>
                        <div className="text-xs">Media DB storage usage approaching threshold (78%). Schedule cleanup or expansion.</div>
                      </div>
                      <button className="btn btn-sm">View</button>
                    </div>
                    
                    <div className="alert alert-info">
                      <HelpCircle className="w-5 h-5" />
                      <div>
                        <h3 className="font-bold">Information</h3>
                        <div className="text-xs">System backup completed successfully at 02:00 AM. Next backup scheduled for tomorrow.</div>
                      </div>
                      <button className="btn btn-sm">View</button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-4 justify-end mt-6">
                <button className="btn btn-warning btn-sm gap-2">
                  <AlertTriangle size={16} />
                  Clear Warnings
                </button>
                <button className="btn btn-error btn-sm gap-2">
                  <AlertCircle size={16} />
                  Clear Critical Alerts
                </button>
                <button className="btn btn-primary btn-sm gap-2">
                  <Download size={16} />
                  Export System Report
                </button>
              </div>
            </>
          )}
          
          {/* Group Management Tab */}
          {activeTab === 'groupManagement' && (
            <>
              <h2 className="text-2xl font-bold mb-6">Group Management</h2>
              
              {/* Group Stats Cards */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-6">
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <UsersGroup className="w-5 h-5 text-primary" />
                      </div>
                      <div className="ml-4">
                        <h3 className="card-title text-base-content/70">Total Groups</h3>
                        <p className="text-2xl font-semibold text-primary mt-1">384</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="size-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-success" />
                      </div>
                      <div className="ml-4">
                        <h3 className="card-title text-base-content/70">Active Groups</h3>
                        <p className="text-2xl font-semibold text-success mt-1">284</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="size-10 rounded-lg bg-warning/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-warning" />
                      </div>
                      <div className="ml-4">
                        <h3 className="card-title text-base-content/70">New This Week</h3>
                        <p className="text-2xl font-semibold text-warning mt-1">37</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="size-10 rounded-lg bg-info/10 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-info" />
                      </div>
                      <div className="ml-4">
                        <h3 className="card-title text-base-content/70">Avg. Members</h3>
                        <p className="text-2xl font-semibold text-info mt-1">18.6</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Search and Filters */}
              <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body">
                  <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
                    <form className="w-full md:w-auto md:min-w-[320px]">
                      <div className="relative w-full">
                        <input
                          type="text"
                          placeholder="Search groups..."
                          className="input input-bordered w-full pr-10"
                        />
                        <button 
                          type="submit" 
                          className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle"
                        >
                          <Search className="h-4 w-4 text-primary" />
                        </button>
                      </div>
                    </form>
                    
                    <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                      <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-outline btn-sm">
                          <ArrowUpDown className="h-4 w-4" />
                          <span className="ml-1">Sort</span>
                        </div>
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                          <li><a>Name (A-Z)</a></li>
                          <li><a>Member Count (High-Low)</a></li>
                          <li><a>Activity (High-Low)</a></li>
                          <li><a>Created Date (Newest)</a></li>
                          <li><a>Created Date (Oldest)</a></li>
                        </ul>
                      </div>
                      <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-outline btn-sm">
                          <Filter className="h-4 w-4" />
                          <span className="ml-1">Filter</span>
                        </div>
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                          <li><a>All Groups</a></li>
                          <li><a>Active Groups</a></li>
                          <li><a>Inactive Groups</a></li>
                          <li><a>Reported Groups</a></li>
                          <li><a>Large Groups (30+ members)</a></li>
                        </ul>
                      </div>
                      <button className="btn btn-primary btn-sm">
                        <Plus className="h-4 w-4" />
                        <span className="ml-1">Create Group</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Groups Table */}
              <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body">
                  <h3 className="card-title flex items-center gap-2 mb-4">
                    <UsersGroup className="w-5 h-5" />
                    All Groups
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                      <thead>
                        <tr>
                          <th>Group</th>
                          <th>Members</th>
                          <th>Creator</th>
                          <th>Created Date</th>
                          <th>Status</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="avatar">
                                <div className="w-10 h-10 rounded-full bg-primary/20">
                                  <span className="text-center w-full text-primary font-bold flex items-center justify-center h-full">DS</span>
                                </div>
                              </div>
                              <span>Dev Squad</span>
                            </div>
                          </td>
                          <td>24</td>
                          <td>John Doe</td>
                          <td>Jan 15, 2023</td>
                          <td><span className="badge badge-success">Active</span></td>
                          <td>
                            <div className="flex justify-end gap-1">
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="View Details">
                                <Eye className="w-4 h-4 text-primary" />
                              </button>
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="Edit Group">
                                <Edit className="w-4 h-4 text-primary" />
                              </button>
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="Delete Group">
                                <Trash2 className="w-4 h-4 text-error" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="avatar">
                                <div className="w-10 h-10 rounded-full bg-secondary/20">
                                  <span className="text-center w-full text-secondary font-bold flex items-center justify-center h-full">MT</span>
                                </div>
                              </div>
                              <span>Marketing Team</span>
                            </div>
                          </td>
                          <td>16</td>
                          <td>Sarah Johnson</td>
                          <td>Mar 22, 2023</td>
                          <td><span className="badge badge-success">Active</span></td>
                          <td>
                            <div className="flex justify-end gap-1">
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="View Details">
                                <Eye className="w-4 h-4 text-primary" />
                              </button>
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="Edit Group">
                                <Edit className="w-4 h-4 text-primary" />
                              </button>
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="Delete Group">
                                <Trash2 className="w-4 h-4 text-error" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="avatar">
                                <div className="w-10 h-10 rounded-full bg-accent/20">
                                  <span className="text-center w-full text-accent font-bold flex items-center justify-center h-full">GC</span>
                                </div>
                              </div>
                              <span>Gaming Crew</span>
                            </div>
                          </td>
                          <td>38</td>
                          <td>Mike Anderson</td>
                          <td>Feb 8, 2023</td>
                          <td><span className="badge badge-success">Active</span></td>
                          <td>
                            <div className="flex justify-end gap-1">
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="View Details">
                                <Eye className="w-4 h-4 text-primary" />
                              </button>
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="Edit Group">
                                <Edit className="w-4 h-4 text-primary" />
                              </button>
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="Delete Group">
                                <Trash2 className="w-4 h-4 text-error" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="avatar">
                                <div className="w-10 h-10 rounded-full bg-info/20">
                                  <span className="text-center w-full text-info font-bold flex items-center justify-center h-full">FF</span>
                                </div>
                              </div>
                              <span>Fitness Friends</span>
                            </div>
                          </td>
                          <td>19</td>
                          <td>Jessica Lee</td>
                          <td>Apr 4, 2023</td>
                          <td><span className="badge badge-success">Active</span></td>
                          <td>
                            <div className="flex justify-end gap-1">
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="View Details">
                                <Eye className="w-4 h-4 text-primary" />
                              </button>
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="Edit Group">
                                <Edit className="w-4 h-4 text-primary" />
                              </button>
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="Delete Group">
                                <Trash2 className="w-4 h-4 text-error" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="avatar">
                                <div className="w-10 h-10 rounded-full bg-error/20">
                                  <span className="text-center w-full text-error font-bold flex items-center justify-center h-full">CP</span>
                                </div>
                              </div>
                              <span>Cooking Pros</span>
                            </div>
                          </td>
                          <td>22</td>
                          <td>Robert Chen</td>
                          <td>May 12, 2023</td>
                          <td><span className="badge badge-warning">Reported</span></td>
                          <td>
                            <div className="flex justify-end gap-1">
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="View Details">
                                <Eye className="w-4 h-4 text-primary" />
                              </button>
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="Edit Group">
                                <Edit className="w-4 h-4 text-primary" />
                              </button>
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="Delete Group">
                                <Trash2 className="w-4 h-4 text-error" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="avatar">
                                <div className="w-10 h-10 rounded-full bg-success/20">
                                  <span className="text-center w-full text-success font-bold flex items-center justify-center h-full">SG</span>
                                </div>
                              </div>
                              <span>Study Group</span>
                            </div>
                          </td>
                          <td>9</td>
                          <td>Lisa Wang</td>
                          <td>Jun 30, 2023</td>
                          <td><span className="badge badge-error">Inactive</span></td>
                          <td>
                            <div className="flex justify-end gap-1">
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="View Details">
                                <Eye className="w-4 h-4 text-primary" />
                              </button>
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="Edit Group">
                                <Edit className="w-4 h-4 text-primary" />
                              </button>
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="Delete Group">
                                <Trash2 className="w-4 h-4 text-error" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-6">
                    <button className="btn btn-sm">Previous</button>
                    <div className="join">
                      <button className="join-item btn btn-sm btn-active">1</button>
                      <button className="join-item btn btn-sm">2</button>
                      <button className="join-item btn btn-sm">3</button>
                      <button className="join-item btn btn-sm">4</button>
                      <button className="join-item btn btn-sm">5</button>
                    </div>
                    <button className="btn btn-sm">Next</button>
                  </div>
                </div>
              </div>
              
              {/* Group Detail Modal Component (Placeholder) */}
              {/* This would be implemented as a modal component */}
              
            </>
          )}
          
          {/* Content Moderation Tab */}
          {activeTab === 'contentModeration' && (
            <>
              <h2 className="text-2xl font-bold mb-6">Content Moderation</h2>
              
              {/* Moderation Stats Cards */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-6">
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="size-10 rounded-lg bg-error/10 flex items-center justify-center">
                        <Flag className="w-5 h-5 text-error" />
                      </div>
                      <div className="ml-4">
                        <h3 className="card-title text-base-content/70">Reported Content</h3>
                        <p className="text-2xl font-semibold text-error mt-1">24</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="size-10 rounded-lg bg-warning/10 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-warning" />
                      </div>
                      <div className="ml-4">
                        <h3 className="card-title text-base-content/70">Pending Review</h3>
                        <p className="text-2xl font-semibold text-warning mt-1">16</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="size-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-success" />
                      </div>
                      <div className="ml-4">
                        <h3 className="card-title text-base-content/70">Resolved</h3>
                        <p className="text-2xl font-semibold text-success mt-1">42</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ClipboardList className="w-5 h-5 text-primary" />
                      </div>
                      <div className="ml-4">
                        <h3 className="card-title text-base-content/70">Auto-Removed</h3>
                        <p className="text-2xl font-semibold text-primary mt-1">87</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tabs for different content moderation views */}
              <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body">
                  <div className="tabs tabs-boxed bg-base-200 mb-6">
                    <a className="tab tab-active">Reported Messages</a>
                    <a className="tab">Reported Users</a>
                    <a className="tab">Reported Groups</a>
                    <a className="tab">Flagged Media</a>
                    <a className="tab">Moderation Log</a>
                  </div>
                  
                  {/* Reported Messages Table */}
                  <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                      <thead>
                        <tr>
                          <th>Severity</th>
                          <th>Message Content</th>
                          <th>Sender</th>
                          <th>Reported By</th>
                          <th>Date</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <span className="badge badge-error gap-1">
                              <AlertCircle className="w-3 h-3" />
                              High
                            </span>
                          </td>
                          <td className="max-w-xs truncate">
                            This content has been flagged as potentially harmful or abusive...
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="avatar">
                                <div className="w-8 h-8 rounded-full">
                                  <img src="/avatar.png" alt="" />
                                </div>
                              </div>
                              <span>John Smith</span>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="avatar">
                                <div className="w-8 h-8 rounded-full">
                                  <img src="/avatar.png" alt="" />
                                </div>
                              </div>
                              <span>Michael Johnson</span>
                            </div>
                          </td>
                          <td>3 hours ago</td>
                          <td>
                            <div className="flex justify-end gap-1">
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="View Details">
                                <Eye className="w-4 h-4 text-primary" />
                              </button>
                              <button className="btn btn-sm btn-success btn-outline tooltip" data-tip="Approve">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button className="btn btn-sm btn-error btn-outline tooltip" data-tip="Remove">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <span className="badge badge-warning gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Medium
                            </span>
                          </td>
                          <td className="max-w-xs truncate">
                            This message contains potentially inappropriate content that violates...
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="avatar">
                                <div className="w-8 h-8 rounded-full">
                                  <img src="/avatar.png" alt="" />
                                </div>
                              </div>
                              <span>Sarah Johnson</span>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="avatar">
                                <div className="w-8 h-8 rounded-full">
                                  <img src="/avatar.png" alt="" />
                                </div>
                              </div>
                              <span>Lisa Chen</span>
                            </div>
                          </td>
                          <td>5 hours ago</td>
                          <td>
                            <div className="flex justify-end gap-1">
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="View Details">
                                <Eye className="w-4 h-4 text-primary" />
                              </button>
                              <button className="btn btn-sm btn-success btn-outline tooltip" data-tip="Approve">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button className="btn btn-sm btn-error btn-outline tooltip" data-tip="Remove">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <span className="badge badge-warning gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Medium
                            </span>
                          </td>
                          <td className="max-w-xs truncate">
                            Message with an attached image that was flagged by our automated system...
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="avatar">
                                <div className="w-8 h-8 rounded-full">
                                  <img src="/avatar.png" alt="" />
                                </div>
                              </div>
                              <span>Robert Davis</span>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-primary badge-sm">System</span>
                          </td>
                          <td>Yesterday</td>
                          <td>
                            <div className="flex justify-end gap-1">
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="View Details">
                                <Eye className="w-4 h-4 text-primary" />
                              </button>
                              <button className="btn btn-sm btn-success btn-outline tooltip" data-tip="Approve">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button className="btn btn-sm btn-error btn-outline tooltip" data-tip="Remove">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <span className="badge badge-info gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Low
                            </span>
                          </td>
                          <td className="max-w-xs truncate">
                            Several users have reported this message as spam or misleading...
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="avatar">
                                <div className="w-8 h-8 rounded-full">
                                  <img src="/avatar.png" alt="" />
                                </div>
                              </div>
                              <span>Thomas Wilson</span>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="badge badge-sm">Multiple (3+)</div>
                            </div>
                          </td>
                          <td>2 days ago</td>
                          <td>
                            <div className="flex justify-end gap-1">
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="View Details">
                                <Eye className="w-4 h-4 text-primary" />
                              </button>
                              <button className="btn btn-sm btn-success btn-outline tooltip" data-tip="Approve">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button className="btn btn-sm btn-error btn-outline tooltip" data-tip="Remove">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-6">
                    <button className="btn btn-sm">Previous</button>
                    <div className="join">
                      <button className="join-item btn btn-sm btn-active">1</button>
                      <button className="join-item btn btn-sm">2</button>
                      <button className="join-item btn btn-sm">3</button>
                    </div>
                    <button className="btn btn-sm">Next</button>
                  </div>
                </div>
              </div>
              
              {/* Message Detail Preview */}
              <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="card-title flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Content Preview
                    </h3>
                    <div className="badge badge-error gap-1">
                      <AlertCircle className="w-3 h-3" />
                      High Severity
                    </div>
                  </div>
                  
                  <div className="bg-base-200 p-4 rounded-lg">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="avatar">
                        <div className="w-10 h-10 rounded-full">
                          <img src="/avatar.png" alt="User Avatar" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <div className="font-medium">John Smith</div>
                          <div className="text-xs text-base-content/60">Today, 14:32</div>
                        </div>
                        <div className="p-3 bg-base-100 rounded-lg">
                          <p>This content has been flagged as potentially harmful or abusive. It appears to violate our community guidelines regarding acceptable content. This message has been automatically hidden until review.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-base-300 pt-4 mt-4">
                      <div className="font-medium mb-2">Report Details:</div>
                      <ul className="text-sm space-y-2">
                        <li><span className="font-medium">Reported by:</span> Michael Johnson</li>
                        <li><span className="font-medium">Report reason:</span> Harassment/Bullying</li>
                        <li><span className="font-medium">Report time:</span> Today at 15:45</li>
                        <li><span className="font-medium">Additional notes:</span> User provided additional context that this is part of a pattern of targeted harassment.</li>
                      </ul>
                    </div>
                    
                    <div className="border-t border-base-300 pt-4 mt-4">
                      <div className="font-medium mb-2">Previous reports for this user:</div>
                      <div className="badge badge-warning gap-1 mr-2">
                        <AlertTriangle className="w-3 h-3" />
                        2 previous warnings
                      </div>
                      <div className="badge badge-error gap-1">
                        <AlertCircle className="w-3 h-3" />
                        1 previous removal
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-4">
                    <div className="dropdown dropdown-top dropdown-end">
                      <div tabIndex={0} role="button" className="btn btn-sm">
                        More Actions
                        <ChevronDown className="w-4 h-4" />
                      </div>
                      <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                        <li><a>Send Warning to User</a></li>
                        <li><a>Mute User (24 hours)</a></li>
                        <li><a>Suspend User (7 days)</a></li>
                        <li><a>Block User Permanently</a></li>
                        <li><a>Mark as False Report</a></li>
                      </ul>
                    </div>
                    <button className="btn btn-sm btn-outline btn-success gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Approve Content
                    </button>
                    <button className="btn btn-sm btn-error gap-2">
                      <Trash2 className="w-4 h-4" />
                      Remove Content
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Content Moderation Settings */}
              <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body">
                  <h3 className="card-title flex items-center gap-2 mb-4">
                    <Sliders className="w-5 h-5" />
                    Moderation Settings
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Auto-moderation level</span>
                        </label>
                        <select className="select select-bordered w-full">
                          <option>Strict - Block most suspicious content</option>
                          <option selected>Moderate - Balance between blocking and allowing</option>
                          <option>Relaxed - Only block clearly problematic content</option>
                        </select>
                        <label className="label">
                          <span className="label-text-alt">Controls how aggressively the system flags content</span>
                        </label>
                      </div>
                      
                      <div className="form-control mt-4">
                        <label className="label cursor-pointer">
                          <span className="label-text font-medium">Auto-delete reported content</span>
                          <input type="checkbox" className="toggle toggle-primary" />
                        </label>
                        <label className="label">
                          <span className="label-text-alt">Automatically remove content with over 5 reports</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Notification settings</span>
                        </label>
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked />
                            <span>Email for high severity reports</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked />
                            <span>Dashboard notification for all reports</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" />
                            <span>Daily moderation summary</span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="form-control mt-4">
                        <label className="label">
                          <span className="label-text font-medium">Report threshold for review</span>
                        </label>
                        <div className="flex items-center gap-4">
                          <input type="range" min="1" max="10" value="3" className="range range-primary" />
                          <span className="bg-primary text-primary-content size-6 rounded-full flex items-center justify-center">3</span>
                        </div>
                        <label className="label">
                          <span className="label-text-alt">Number of reports needed before content is flagged for review</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <button className="btn btn-primary">Save Settings</button>
                  </div>
                </div>
              </div>
            </>
          )}
          
          {/* User Verification Tab */}
          {activeTab === 'userVerification' && (
            <>
              <h2 className="text-2xl font-bold mb-6">User Verification</h2>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-6">
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="size-10 rounded-lg bg-warning/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-warning" />
                      </div>
                      <div className="ml-4">
                        <h3 className="card-title text-base-content/70">Pending Verification</h3>
                        <p className="text-2xl font-semibold text-warning mt-1">24</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="size-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-success" />
                      </div>
                      <div className="ml-4">
                        <h3 className="card-title text-base-content/70">Verified Users</h3>
                        <p className="text-2xl font-semibold text-success mt-1">156</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="size-10 rounded-lg bg-error/10 flex items-center justify-center">
                        <UserX className="w-5 h-5 text-error" />
                      </div>
                      <div className="ml-4">
                        <h3 className="card-title text-base-content/70">Rejected</h3>
                        <p className="text-2xl font-semibold text-error mt-1">18</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mb-6">
                <button className="btn btn-success btn-sm gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Approve Selected
                </button>
                <button className="btn btn-error btn-sm gap-2">
                  <X className="w-4 h-4" />
                  Reject Selected
                </button>
                <button className="btn btn-outline btn-sm gap-2">
                  <MailIcon className="w-4 h-4" />
                  Message Selected
                </button>
                <div className="flex-1"></div>
                <div className="join">
                  <input className="join-item input input-bordered input-sm w-60" placeholder="Search by name or email" />
                  <button className="join-item btn btn-sm">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Verification Queue */}
              <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body">
                  <h3 className="card-title flex items-center gap-2 mb-4">
                    <CheckSquare className="w-5 h-5" />
                    Verification Queue
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                      <thead>
                        <tr>
                          <th>
                            <label>
                              <input type="checkbox" className="checkbox checkbox-sm" />
                            </label>
                          </th>
                          <th>User</th>
                          <th>Verification Type</th>
                          <th>Requested On</th>
                          <th>Status</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <label>
                              <input type="checkbox" className="checkbox checkbox-sm" />
                            </label>
                          </td>
                          <td className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="avatar">
                                <div className="w-10 h-10 rounded-full">
                                  <img src="/avatar.png" alt="" />
                                </div>
                              </div>
                              <div>
                                <div>Alex Johnson</div>
                                <div className="text-sm opacity-50">alex.johnson@example.com</div>
                              </div>
                            </div>
                          </td>
                          <td>Identity Verification</td>
                          <td>2 hours ago</td>
                          <td><span className="badge badge-warning">Pending</span></td>
                          <td>
                            <div className="flex justify-end gap-1">
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="View Details">
                                <Eye className="w-4 h-4 text-primary" />
                              </button>
                              <button className="btn btn-sm btn-ghost text-success tooltip" data-tip="Approve">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button className="btn btn-sm btn-ghost text-error tooltip" data-tip="Reject">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <label>
                              <input type="checkbox" className="checkbox checkbox-sm" />
                            </label>
                          </td>
                          <td className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="avatar">
                                <div className="w-10 h-10 rounded-full">
                                  <img src="/avatar.png" alt="" />
                                </div>
                              </div>
                              <div>
                                <div>Maria Garcia</div>
                                <div className="text-sm opacity-50">maria.g@example.com</div>
                              </div>
                            </div>
                          </td>
                          <td>Professional Account</td>
                          <td>5 hours ago</td>
                          <td><span className="badge badge-warning">Pending</span></td>
                          <td>
                            <div className="flex justify-end gap-1">
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="View Details">
                                <Eye className="w-4 h-4 text-primary" />
                              </button>
                              <button className="btn btn-sm btn-ghost text-success tooltip" data-tip="Approve">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button className="btn btn-sm btn-ghost text-error tooltip" data-tip="Reject">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <label>
                              <input type="checkbox" className="checkbox checkbox-sm" />
                            </label>
                          </td>
                          <td className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="avatar">
                                <div className="w-10 h-10 rounded-full">
                                  <img src="/avatar.png" alt="" />
                                </div>
                              </div>
                              <div>
                                <div>David Wilson</div>
                                <div className="text-sm opacity-50">david.w@example.com</div>
                              </div>
                            </div>
                          </td>
                          <td>Identity Verification</td>
                          <td>Yesterday</td>
                          <td><span className="badge badge-warning">Pending</span></td>
                          <td>
                            <div className="flex justify-end gap-1">
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="View Details">
                                <Eye className="w-4 h-4 text-primary" />
                              </button>
                              <button className="btn btn-sm btn-ghost text-success tooltip" data-tip="Approve">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button className="btn btn-sm btn-ghost text-error tooltip" data-tip="Reject">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <label>
                              <input type="checkbox" className="checkbox checkbox-sm" />
                            </label>
                          </td>
                          <td className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="avatar">
                                <div className="w-10 h-10 rounded-full">
                                  <img src="/avatar.png" alt="" />
                                </div>
                              </div>
                              <div>
                                <div>Jennifer Smith</div>
                                <div className="text-sm opacity-50">j.smith@example.com</div>
                              </div>
                            </div>
                          </td>
                          <td>Business Account</td>
                          <td>Yesterday</td>
                          <td><span className="badge badge-warning">Pending</span></td>
                          <td>
                            <div className="flex justify-end gap-1">
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="View Details">
                                <Eye className="w-4 h-4 text-primary" />
                              </button>
                              <button className="btn btn-sm btn-ghost text-success tooltip" data-tip="Approve">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button className="btn btn-sm btn-ghost text-error tooltip" data-tip="Reject">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <label>
                              <input type="checkbox" className="checkbox checkbox-sm" />
                            </label>
                          </td>
                          <td className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="avatar">
                                <div className="w-10 h-10 rounded-full">
                                  <img src="/avatar.png" alt="" />
                                </div>
                              </div>
                              <div>
                                <div>Robert Brown</div>
                                <div className="text-sm opacity-50">robert.b@example.com</div>
                              </div>
                            </div>
                          </td>
                          <td>Identity Verification</td>
                          <td>2 days ago</td>
                          <td><span className="badge badge-warning">Pending</span></td>
                          <td>
                            <div className="flex justify-end gap-1">
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="View Details">
                                <Eye className="w-4 h-4 text-primary" />
                              </button>
                              <button className="btn btn-sm btn-ghost text-success tooltip" data-tip="Approve">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button className="btn btn-sm btn-ghost text-error tooltip" data-tip="Reject">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-6">
                    <button className="btn btn-sm">Previous</button>
                    <div className="join">
                      <button className="join-item btn btn-sm btn-active">1</button>
                      <button className="join-item btn btn-sm">2</button>
                      <button className="join-item btn btn-sm">3</button>
                    </div>
                    <button className="btn btn-sm">Next</button>
                  </div>
                </div>
              </div>
              
              {/* Verification Settings */}
              <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body">
                  <h3 className="card-title flex items-center gap-2 mb-4">
                    <Sliders className="w-5 h-5" />
                    Verification Settings
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Verification requirements</span>
                        </label>
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked />
                            <span>Require email verification</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked />
                            <span>Require phone verification</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" />
                            <span>Require ID verification for all users</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked />
                            <span>Allow social media login</span>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Automatic verification</span>
                        </label>
                        <select className="select select-bordered w-full">
                          <option>Disabled - Manual review for all users</option>
                          <option selected>Basic - Auto-verify email & phone</option>
                          <option>Enhanced - Use AI to verify ID documents</option>
                        </select>
                        <label className="label">
                          <span className="label-text-alt">Controls the level of automatic verification</span>
                        </label>
                      </div>
                      
                      <div className="form-control mt-4">
                        <label className="label cursor-pointer justify-start gap-4">
                          <span className="label-text font-medium">Require verification for messaging</span>
                          <input type="checkbox" className="toggle toggle-primary" checked />
                        </label>
                        <label className="label">
                          <span className="label-text-alt">Users must complete verification before sending messages</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <button className="btn btn-primary">Save Settings</button>
                  </div>
                </div>
              </div>
            </>
          )}
          
          {/* Notification Center Tab */}
          {activeTab === 'notificationCenter' && (
            <>
              <h2 className="text-2xl font-bold mb-6">Notification Center</h2>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-6">
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Megaphone className="w-5 h-5 text-primary" />
                      </div>
                      <div className="ml-4">
                        <h3 className="card-title text-base-content/70">Total Notifications</h3>
                        <p className="text-2xl font-semibold text-primary mt-1">168</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="size-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-success" />
                      </div>
                      <div className="ml-4">
                        <h3 className="card-title text-base-content/70">Scheduled</h3>
                        <p className="text-2xl font-semibold text-success mt-1">12</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="size-10 rounded-lg bg-info/10 flex items-center justify-center">
                        <Send className="w-5 h-5 text-info" />
                      </div>
                      <div className="ml-4">
                        <h3 className="card-title text-base-content/70">Delivered</h3>
                        <p className="text-2xl font-semibold text-info mt-1">156</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="size-10 rounded-lg bg-warning/10 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-warning" />
                      </div>
                      <div className="ml-4">
                        <h3 className="card-title text-base-content/70">Open Rate</h3>
                        <p className="text-2xl font-semibold text-warning mt-1">68.4%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Create Notification */}
              <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body">
                  <h3 className="card-title flex items-center gap-2 mb-4">
                    <Megaphone className="w-5 h-5" />
                    Create New Notification
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">Notification Type</span>
                      </label>
                      <select className="select select-bordered w-full">
                        <option>System Announcement</option>
                        <option>Maintenance Notice</option>
                        <option>Feature Update</option>
                        <option>Security Alert</option>
                        <option>Custom Message</option>
                      </select>
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">Title</span>
                      </label>
                      <input type="text" className="input input-bordered" placeholder="Enter notification title" />
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">Message</span>
                      </label>
                      <textarea className="textarea textarea-bordered h-24" placeholder="Enter notification message"></textarea>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Recipients</span>
                        </label>
                        <select className="select select-bordered w-full">
                          <option>All Users</option>
                          <option>Active Users Only</option>
                          <option>Admin Users</option>
                          <option>New Users ( 30 days)</option>
                          <option>Custom Selection</option>
                        </select>
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Delivery Method</span>
                        </label>
                        <select className="select select-bordered w-full">
                          <option>In-App Notification</option>
                          <option>Email</option>
                          <option>Push Notification</option>
                          <option>All Channels</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Priority</span>
                        </label>
                        <select className="select select-bordered w-full">
                          <option>Low</option>
                          <option selected>Medium</option>
                          <option>High</option>
                          <option>Urgent</option>
                        </select>
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Send Time</span>
                        </label>
                        <div className="flex gap-2">
                          <select className="select select-bordered flex-1">
                            <option>Send Immediately</option>
                            <option>Schedule for Later</option>
                            <option>Recurring</option>
                          </select>
                          <button className="btn">
                            <Calendar className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="form-control">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" />
                        <span>Allow users to dismiss this notification</span>
                      </label>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <button className="btn btn-outline">Save as Draft</button>
                      <button className="btn btn-primary">Send Notification</button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Notification History */}
              <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body">
                  <h3 className="card-title flex items-center gap-2 mb-4">
                    <ClipboardList className="w-5 h-5" />
                    Notification History
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Type</th>
                          <th>Recipients</th>
                          <th>Sent Date</th>
                          <th>Status</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="font-medium">
                            System Maintenance - July 25
                          </td>
                          <td>
                            <span className="badge badge-warning">Maintenance</span>
                          </td>
                          <td>All Users</td>
                          <td>Today, 10:25 AM</td>
                          <td><span className="badge badge-success">Sent</span></td>
                          <td>
                            <div className="flex justify-end gap-1">
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="View Details">
                                <Eye className="w-4 h-4 text-primary" />
                              </button>
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="Duplicate">
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="font-medium">
                            New Features Available - Group Chat
                          </td>
                          <td>
                            <span className="badge badge-info">Feature Update</span>
                          </td>
                          <td>All Users</td>
                          <td>Yesterday</td>
                          <td><span className="badge badge-success">Sent</span></td>
                          <td>
                            <div className="flex justify-end gap-1">
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="View Details">
                                <Eye className="w-4 h-4 text-primary" />
                              </button>
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="Duplicate">
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="font-medium">
                            Welcome New Users - July Cohort
                          </td>
                          <td>
                            <span className="badge badge-primary">Custom</span>
                          </td>
                          <td>New Users</td>
                          <td>07/15/2023</td>
                          <td><span className="badge badge-success">Sent</span></td>
                          <td>
                            <div className="flex justify-end gap-1">
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="View Details">
                                <Eye className="w-4 h-4 text-primary" />
                              </button>
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="Duplicate">
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="font-medium">
                            August Product Updates
                          </td>
                          <td>
                            <span className="badge badge-info">Feature Update</span>
                          </td>
                          <td>All Users</td>
                          <td>08/01/2023 (Scheduled)</td>
                          <td><span className="badge badge-warning">Scheduled</span></td>
                          <td>
                            <div className="flex justify-end gap-1">
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="View Details">
                                <Eye className="w-4 h-4 text-primary" />
                              </button>
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="Edit">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="Cancel">
                                <X className="w-4 h-4 text-error" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="font-medium">
                            Important Security Update
                          </td>
                          <td>
                            <span className="badge badge-error">Security</span>
                          </td>
                          <td>All Users</td>
                          <td>07/10/2023</td>
                          <td><span className="badge badge-success">Sent</span></td>
                          <td>
                            <div className="flex justify-end gap-1">
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="View Details">
                                <Eye className="w-4 h-4 text-primary" />
                              </button>
                              <button className="btn btn-sm btn-ghost tooltip" data-tip="Duplicate">
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-6">
                    <button className="btn btn-sm">Previous</button>
                    <div className="join">
                      <button className="join-item btn btn-sm btn-active">1</button>
                      <button className="join-item btn btn-sm">2</button>
                      <button className="join-item btn btn-sm">3</button>
                    </div>
                    <button className="btn btn-sm">Next</button>
                  </div>
                </div>
              </div>
              
              {/* Analytics */}
              <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body">
                  <h3 className="card-title flex items-center gap-2 mb-4">
                    <BarChart className="w-5 h-5" />
                    Notification Analytics
                  </h3>
                  
                  <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
                    <div className="stat">
                      <div className="stat-title">Delivered</div>
                      <div className="stat-value text-primary">98.2%</div>
                      <div className="stat-desc">Last 7 days</div>
                    </div>
                    
                    <div className="stat">
                      <div className="stat-title">Open Rate</div>
                      <div className="stat-value text-secondary">68.4%</div>
                      <div className="stat-desc">Last 7 days</div>
                    </div>
                    
                    <div className="stat">
                      <div className="stat-title">Click Rate</div>
                      <div className="stat-value">42.1%</div>
                      <div className="stat-desc">Last 7 days</div>
                    </div>
                    
                    <div className="stat">
                      <div className="stat-title">Dismissed</div>
                      <div className="stat-value text-error">12.6%</div>
                      <div className="stat-desc">Last 7 days</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <button className="btn btn-outline btn-sm gap-2">
                      <Download size={16} />
                      Export Analytics
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
          
          {showUserDetailModal && (
            <UserDetailModal 
              user={selectedUser} 
              onClose={() => setShowUserDetailModal(false)} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;