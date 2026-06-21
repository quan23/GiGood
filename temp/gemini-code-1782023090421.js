import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// THEME MÀU SẮC THEO ĐÚNG NHẬN DIỆN THƯƠNG HIỆU GIGOOD
const COLORS = {
  orange: '#ea580c',
  orangeHover: '#c2410c',
  orangeLight: '#ffedd5',
  teal: '#0f766e',
  tealHover: '#115e59',
  tealLight: '#f0fdfa',
  stoneDark: '#1c1917',
  stoneLight: '#fafaf9',
  stoneBorder: '#e7e5e4',
  grayText: '#78716c',
};

export default function App() {
  // STATE ĐĂNG NHẬP / HỆ THỐNG
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState({ name: '', role: 'seeker', credits: 50000 });
  const [activeTab, setActiveTab] = useState('main'); // main, chat
  const [seekerSubTab, setSeekerSubTab] = useState('active'); // active, history
  const [taskerSubTab, setTaskerSubTab] = useState('market'); // market, active
  const [activeChatJobId, setActiveChatJobId] = useState(null);
  
  // STATE NHẬP LIỆU FORM
  const [customName, setCustomName] = useState('');
  const [customRole, setCustomRole] = useState('seeker');
  const [jobTitle, setJobTitle] = useState('');
  const [jobCategory, setJobCategory] = useState('Phụ việc quán café');
  const [jobBudget, setJobBudget] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [chatInput, setChatInput] = useState('');

  // STATE MODAL ĐÁNH GIÁ
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [selectedRatingJobId, setSelectedRatingJobId] = useState(null);
  const [ratingScore, setRatingScore] = useState('5');
  const [ratingComment, setRatingComment] = useState('');

  // DỮ LIỆU MẪU BAN ĐẦU
  const [jobs, setJobs] = useState([
    {
      id: 'job-001',
      title: 'Cần bạn phụ chạy bàn quán cà phê ca tối',
      category: 'Phụ việc quán café',
      budget: 150000,
      location: 'Hải Châu, Đà Nẵng',
      desc: 'Cần bạn sinh viên hỗ trợ order nước và dọn dẹp bàn ghế từ 18h - 22h tối nay.',
      status: 'finding', // finding, assigned, completed
      seekerName: 'Khánh Vy',
      taskerName: null,
      chats: [],
      seekerRating: null,
      isCompletedReportedByTasker: false,
    },
    {
      id: 'job-002',
      title: 'Hỗ trợ setup bê vác đồ sự kiện tiệc cưới',
      category: 'Hỗ trợ sự kiện',
      budget: 250000,
      location: 'Sơn Trà, Đà Nẵng',
      desc: 'Setup phông nền sân khấu, loa đài cho tiệc cưới ngoài trời lân cận bãi biển.',
      status: 'finding',
      seekerName: 'Khánh Vy',
      taskerName: null,
      chats: [],
      seekerRating: null,
      isCompletedReportedByTasker: false,
    }
  ]);

  const [notifications, setNotifications] = useState([
    { id: '1', text: 'Chào mừng đến với GiGood Mobile! Bạn được tặng 50,000đ trải nghiệm.', time: 'Hệ thống' }
  ]);

  // HÀM XỬ LÝ ĐĂNG NHẬP NHANH
  const handleQuickLogin = (role) => {
    const name = role === 'seeker' ? 'Khánh Vy' : 'Minh Quân';
    setProfile({ name, role, credits: 50000 });
    setIsLoggedIn(true);
    addNotification(`Người dùng ${name} vừa kết nối vào hệ thống.`, 'Hệ thống');
  };

  // ĐĂNG KÝ TÙY CHỈNH
  const handleCustomLogin = () => {
    if (!customName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền tên hiển thị.');
      return;
    }
    setProfile({ name: customName, role: customRole, credits: 50000 });
    setIsLoggedIn(true);
    addNotification(`Người dùng ${customName} vừa đăng ký thành công.`, 'Hệ thống');
  };

  const addNotification = (text, time) => {
    setNotifications(prev => [{ id: Date.now().toString(), text, time }, ...prev]);
  };

  // ĐỔI VAI TRÒ NHANH TRÊN MOBILE BANNER
  const toggleRole = () => {
    setProfile(prev => ({ ...prev, role: prev.role === 'seeker' ? 'tasker' : 'seeker' }));
    Alert.alert('Thông báo', `Đã chuyển sang góc nhìn ${profile.role === 'seeker' ? 'Tasker (Thợ)' : 'Seeker (Người thuê)'}`);
  };

  // NẠP TIỀN GIẢ LẬP
  const buyCredits = (amount) => {
    setProfile(prev => ({ ...prev, credits: prev.credits + amount }));
    addNotification(`Nạp thành công ${amount.toLocaleString()}đ vào ví.`, 'Ví điện tử');
    Alert.alert('Thành công', `Đã nạp giả lập +${amount.toLocaleString()} VND`);
  };

  // SEEKER: ĐĂNG VIỆC MỚI (ESCROW KÝ QUỸ)
  const handleCreateJob = () => {
    if (!jobTitle || !jobBudget || !jobLocation) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ các trường thông tin bắt buộc.');
      return;
    }
    const newJob = {
      id: `job-${Date.now()}`,
      title: jobTitle,
      category: jobCategory,
      budget: parseInt(jobBudget) || 0,
      location: jobLocation,
      desc: jobDesc || 'Không có mô tả thêm',
      status: 'finding',
      seekerName: profile.name,
      taskerName: null,
      chats: [],
      seekerRating: null,
      isCompletedReportedByTasker: false
    };

    setJobs(prev => [newJob, ...prev]);
    addNotification(`Đơn việc [${jobTitle}] đã được đưa lên hệ thống ký quỹ bảo lãnh.`, 'Seeker');
    Alert.alert('Thành công', 'Đã đăng tin và chuyển tiền ký quỹ trung gian an toàn.');
    
    // Clear Form
    setJobTitle('');
    setJobBudget('');
    setJobLocation('');
    setJobDesc('');
  };

  // TASKER: GIẬT ĐƠN (TRỪ 10.000Đ PHIẾU FREEMIUM)
  const handleAcceptJob = (jobId) => {
    if (profile.credits < 10000) {
      Alert.alert('Thất bại', 'Số dư ví không đủ 10.000đ để mở hồ sơ kết nối.');
      return;
    }

    setProfile(prev => ({ ...prev, credits: prev.credits - 10000 }));
    setJobs(prev => prev.map(job => {
      if (job.id === jobId) {
        return {
          ...job,
          status: 'assigned',
          taskerName: profile.name,
          chats: [{
            sender: 'tasker',
            text: `Chào anh/chị, em là thợ ${profile.name} ở lân cận vị trí của mình. Em xin phép nhận đơn hỗ trợ việc này nhé!`,
            time: 'Bây giờ'
          }]
        };
      }
      return job;
    }));

    addNotification(`Bạn đã nhận công việc thành công. Khấu trừ 10,000đ kết nối.`, 'Tasker');
    setActiveChatJobId(jobId);
    setActiveTab('chat');
    setTaskerSubTab('active');
  };

  // TASKER: BÁO CÁO HOÀN THÀNH VẬT LÝ
  const handleReportComplete = (jobId) => {
    setJobs(prev => prev.map(job => {
      if (job.id === jobId) {
        return {
          ...job,
          isCompletedReportedByTasker: true,
          chats: [...job.chats, {
            sender: 'system-alert',
            text: '🔔 HỆ THỐNG: Thợ thông báo đã hoàn thành. Vui lòng bấm nút giải ngân ký quỹ.',
            time: 'Hệ thống'
          }]
        };
      }
      return job;
    }));
    Alert.alert('Thông báo', 'Đã gửi báo cáo hoàn thành đến chủ việc.');
  };

  // SEEKER: PHÊ DUYỆT GIẢI NGÂN & RATING
  const handleOpenRating = (jobId) => {
    setSelectedRatingJobId(jobId);
    setIsRatingModalVisible(true);
  };

  const handleSubmitRating = () => {
    setJobs(prev => prev.map(job => {
      if (job.id === selectedRatingJobId) {
        return { ...job, status: 'completed', seekerRating: ratingScore };
      }
      return job;
    }));
    
    // Thu 10% hoa hồng sàn như tài liệu nghiệp vụ
    addNotification('Giải ngân đơn hàng thành công, hệ thống thu 10% phí vận hành.', 'Hệ thống');
    setIsRatingModalVisible(false);
    Alert.alert('Thành công', 'Đã giải ngân thù lao từ cổng Escrow về ví của thợ.');
  };

  // CHAT SYSTEM
  const handleSendChat = () => {
    if (!chatInput.trim() || !activeChatJobId) return;

    setJobs(prev => prev.map(job => {
      if (job.id === activeChatJobId) {
        return {
          ...job,
          chats: [...job.chats, { sender: profile.role, text: chatInput, time: 'Vừa xong' }]
        };
      }
      return job;
    }));
    
    const currentInput = chatInput;
    setChatInput('');

    // Giả lập đối phương rep chat sau 1 giây
    setTimeout(() => {
      setJobs(prev => prev.map(job => {
        if (job.id === activeChatJobId) {
          const reply = profile.role === 'seeker' 
            ? 'Dạ em nghe rõ rồi ạ, em đang chạy tới điểm hẹn.' 
            : 'Ok em nhé, cứ làm cẩn thận là được.';
          return {
            ...job,
            chats: [...job.chats, { sender: profile.role === 'seeker' ? 'tasker' : 'seeker', text: reply, time: 'Vừa xong' }]
          };
        }
        return job;
      }));
    }, 1000);
  };

  const activeChatJob = jobs.find(j => j.id === activeChatJobId);

  // ==========================================
  // GIAO DIỆN CHƯA ĐĂNG NHẬP (AUTH ONBOARDING)
  // ==========================================
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.orange} />
        <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
          
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>G</Text>
          </View>
          <Text style={styles.brandTitle}>GiGood Mobile</Text>
          <Text style={styles.brandSubtitle}>Hệ sinh thái kết nối vi-việc làm &amp; Ký quỹ bảo chứng</Text>

          {/* Chọn tài khoản nhanh */}
          <View style={styles.authSection}>
            <Text style={styles.sectionLabel}>ĐĂNG NHẬP NHANH BẢN MÔ PHỎNG</Text>
            
            <TouchableOpacity style={[styles.quickCard, { borderColor: COLORS.orangeLight }]} onPress={() => handleQuickLogin('seeker')}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100' }} style={[styles.avatar, { borderColor: COLORS.orange }]} />
              <View>
                <Text style={[styles.quickName, { color: COLORS.orange }]}>Khánh Vy</Text>
                <Text style={styles.quickRole}>Vai trò: Seeker (Người thuê)</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.quickCard, { borderColor: COLORS.tealLight }]} onPress={() => handleQuickLogin('tasker')}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' }} style={[styles.avatar, { borderColor: COLORS.teal }]} />
              <View>
                <Text style={[styles.quickName, { color: COLORS.teal }]}>Minh Quân</Text>
                <Text style={styles.quickRole}>Vai trò: Tasker (Người nhận việc)</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Form đăng ký thủ công */}
          <View style={[styles.authSection, { marginTop: 20 }]}>
            <Text style={styles.sectionLabel}>HOẶC TẠO TÀI KHOẢN TÙY CHỈNH</Text>
            
            <TextInput 
              style={styles.mobileInput} 
              placeholder="Nhập tên của bạn..." 
              value={customName}
              onChangeText={setCustomName}
            />
            
            <View style={styles.roleSelectorRow}>
              <TouchableOpacity 
                style={[styles.roleSelectBtn, customRole === 'seeker' && { backgroundColor: COLORS.orange }]} 
                onPress={() => setCustomRole('seeker')}
              >
                <Text style={[styles.roleSelectBtnText, customRole === 'seeker' && { color: '#fff' }]}>Làm Seeker</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.roleSelectBtn, customRole === 'tasker' && { backgroundColor: COLORS.teal }]} 
                onPress={() => setCustomRole('tasker')}
              >
                <Text style={[styles.roleSelectBtnText, customRole === 'tasker' && { color: '#fff' }]}>Làm Tasker</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.submitAuthBtn} onPress={handleCustomLogin}>
              <Text style={styles.submitAuthBtnText}>Kích Hoạt Ứng Dụng</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    );
  }

  // ==========================================
  // GIAO DIỆN CHÍNH SAU KHI ĐĂNG NHẬP
  // ==========================================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* HEADER DI ĐỘNG */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>GiGood App</Text>
          <View style={styles.badgeRow}>
            <Text style={[styles.roleBadge, { backgroundColor: profile.role === 'seeker' ? COLORS.orangeLight : COLORS.tealLight, color: profile.role === 'seeker' ? COLORS.orange : COLORS.teal }]}>
              {profile.role === 'seeker' ? 'Seeker (Chủ)' : 'Tasker (Thợ)'}
            </Text>
            <Text style={styles.walletBadge}>Ví: {profile.credits.toLocaleString()}đ</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.switchRoleBtn} onPress={toggleRole}>
          <FontAwesome6 name="arrows-rotate" size={14} color="#fff" />
          <Text style={styles.switchRoleText}>Đổi vai</Text>
        </TouchableOpacity>
      </View>

      {/* NỘI DUNG MÀN HÌNH CHÍNH (MAIN TAB VÀ CHAT TAB) */}
      {activeTab === 'main' ? (
        <ScrollView style={styles.workspaceScroll} contentContainerStyle={{ paddingBottom: 30 }}>
          
          {/* VÍ TIỀN & THÔNG BÁO NHANH */}
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Ví Số Dư Freemium</Text>
            <Text style={styles.bigMoney}>{profile.credits.toLocaleString()} VND</Text>
            <View style={styles.quickBuyRow}>
              <TouchableOpacity style={styles.buyBtn} onPress={() => buyCredits(100000)}>
                <Text style={styles.buyBtnText}>+100K Token</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.buyBtn, { backgroundColor: COLORS.teal }]} onPress={() => buyCredits(200000)}>
                <Text style={styles.buyBtnText}>+200K Đăng Tin</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ================= LUỒNG GIAO DIỆN NGƯỜI THUÊ (SEEKER) ================= */}
          {profile.role === 'seeker' && (
            <View style={styles.rolePanel}>
              <View style={styles.cardHeader}>
                <Ionicons name="add-circle" size={20} color={COLORS.orange} />
                <Text style={styles.cardHeaderText}>Đăng Việc Vặt Ký Quỹ Mới</Text>
              </View>

              <TextInput style={styles.mobileInput} placeholder="Tiêu đề (Ví dụ: Dọn kho bốc xếp 3 tiếng)" value={jobTitle} onChangeText={setJobTitle} />
              <TextInput style={styles.mobileInput} placeholder="Thù lao đề xuất (VND)" keyboardType="numeric" value={jobBudget} onChangeText={setJobBudget} />
              <TextInput style={styles.mobileInput} placeholder="Địa chỉ làm việc tại Đà Nẵng" value={jobLocation} onChangeText={setJobLocation} />
              <TextInput style={[styles.mobileInput, { height: 60 }]} placeholder="Mô tả chi tiết việc cần thợ làm..." multiline value={jobDesc} onChangeText={setJobDesc} />

              <TouchableOpacity style={styles.mainActionBtn} onPress={handleCreateJob}>
                <Text style={styles.mainActionBtnText}>Đăng Tin &amp; Chuyển Khoản Escrow</Text>
              </TouchableOpacity>

              {/* Danh sách quản lý đơn của Seeker */}
              <View style={styles.subTabRow}>
                <TouchableOpacity style={[styles.subTabItem, seekerSubTab === 'active' && styles.subTabItemActive]} onPress={() => setSeekerSubTab('active')}>
                  <Text style={[styles.subTabText, seekerSubTab === 'active' && { color: COLORS.orange }]}>Việc Đang Tuyển</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.subTabItem, seekerSubTab === 'history' && styles.subTabItemActive]} onPress={() => setSeekerSubTab('history')}>
                  <Text style={[styles.subTabText, seekerSubTab === 'history' && { color: COLORS.orange }]}>Lịch Sử Hoàn Tất</Text>
                </TouchableOpacity>
              </View>

              {jobs.filter(j => seekerSubTab === 'active' ? j.status !== 'completed' : j.status === 'completed').map(job => (
                <View key={job.id} style={styles.jobItemCard}>
                  <Text style={styles.jobItemCategory}>{job.category}</Text>
                  <Text style={styles.jobItemTitle}>{job.title}</Text>
                  <Text style={styles.jobItemLocation}><Ionicons name="location-sharp" size={12} /> {job.location}</Text>
                  <Text style={styles.jobItemBudget}>Thù lao: {job.budget.toLocaleString()}đ</Text>
                  
                  {job.status === 'assigned' && job.isCompletedReportedByTasker && (
                    <TouchableOpacity style={styles.approveTaskBtn} onPress={() => handleOpenRating(job.id)}>
                      <Text style={styles.approveTaskBtnText}>Phê Duyệt &amp; Giải Ngân Ngay</Text>
                    </TouchableOpacity>
                  )}
                  {job.status === 'assigned' && !job.isCompletedReportedByTasker && (
                    <Text style={styles.statusWaitText}>🕒 Thợ đang làm việc...</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* ================= LUỒNG GIAO DIỆN NGƯỜI NHẬN VIỆC (TASKER) ================= */}
          {profile.role === 'tasker' && (
            <View style={styles.rolePanel}>
              
              {/* Radar Định vị GPS Ảo */}
              <View style={styles.radarCard}>
                <Text style={styles.radarTitle}>🛰️ Radar Quét Việc Bán Kính 2km</Text>
                <Text style={styles.radarDesc}>Đang sử dụng định vị GPS tự động phát hiện micro-jobs xung quanh khu vực Đà Nẵng.</Text>
              </View>

              <View style={styles.subTabRow}>
                <TouchableOpacity style={[styles.subTabItem, taskerSubTab === 'market' && { borderBottomColor: COLORS.teal }]} onPress={() => setTaskerSubTab('market')}>
                  <Text style={[styles.subTabText, taskerSubTab === 'market' && { color: COLORS.teal }]}>Sàn Việc Làm Gần Đây</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.subTabItem, taskerSubTab === 'active' && { borderBottomColor: COLORS.teal }]} onPress={() => setTaskerSubTab('active')}>
                  <Text style={[styles.subTabText, taskerSubTab === 'active' && { color: COLORS.teal }]}>Việc Bạn Đã Nhận</Text>
                </TouchableOpacity>
              </View>

              {taskerSubTab === 'market' ? (
                jobs.filter(j => j.status === 'finding').map(job => (
                  <View key={job.id} style={styles.jobItemCard}>
                    <Text style={[styles.jobItemCategory, { backgroundColor: COLORS.tealLight, color: COLORS.teal }]}>{job.category}</Text>
                    <Text style={styles.jobItemTitle}>{job.title}</Text>
                    <Text style={styles.jobItemLocation}>{job.location}</Text>
                    <Text style={[styles.jobItemBudget, { color: COLORS.teal }]}>{job.budget.toLocaleString()}đ</Text>
                    
                    <TouchableOpacity style={[styles.approveTaskBtn, { backgroundColor: COLORS.teal }]} onPress={() => handleAcceptJob(job.id)}>
                      <Text style={styles.approveTaskBtnText}>Giật Đơn (Phí 10K)</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                jobs.filter(j => j.status !== 'finding' && j.taskerName === profile.name).map(job => (
                  <View key={job.id} style={styles.jobItemCard}>
                    <Text style={styles.jobItemTitle}>{job.title}</Text>
                    <Text style={styles.jobItemBudget}>Lương: {job.budget.toLocaleString()}đ</Text>
                    
                    {job.status === 'assigned' && !job.isCompletedReportedByTasker && (
                      <TouchableOpacity style={[styles.approveTaskBtn, { backgroundColor: '#ea580c' }]} onPress={() => handleReportComplete(job.id)}>
                        <Text style={styles.approveTaskBtnText}>Báo Cáo Đã Hoàn Thành Xong</Text>
                      </TouchableOpacity>
                    )}
                    {job.isCompletedReportedByTasker && job.status !== 'completed' && (
                      <Text style={styles.statusWaitText}>✓ Đã báo cáo thành công, chờ chủ ví giải ngân...</Text>
                    )}
                    {job.status === 'completed' && (
                      <Text style={[styles.statusWaitText, { color: 'green' }]}>✓ Đã nhận giải ngân về ví ảo (Trừ 10% hoa hồng)</Text>
                    )}
                  </View>
                ))
              )}
            </View>
          )}

        </ScrollView>
      ) : (
        // ==========================================
        // CỬA SỔ HỘI THOẠI CHAT CHỮA CHÁY (CHAT TAB)
        // ==========================================
        <View style={styles.chatWorkspace}>
          {!activeChatJobId ? (
            <View style={styles.centerBox}>
              <Ionicons name="chatbubbles-outline" size={40} color="#ccc" />
              <Text style={{ fontSize: 13, color: '#999', marginTop: 10 }}>Chưa có phòng chat đàm phán nào được kích hoạt.</Text>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatHeaderTitle}>{activeChatJob?.title}</Text>
                <Text style={styles.chatHeaderSub}>Kênh bảo mật của {profile.name}</Text>
              </View>

              <ScrollView style={styles.chatMessageArea} contentContainerStyle={{ padding: 15 }}>
                {activeChatJob?.chats.map((chat, idx) => {
                  const isMe = chat.sender === profile.role;
                  const isSys = chat.sender === 'system-alert';
                  if (isSys) {
                    return (
                      <View key={idx} style={styles.sysMsgBox}>
                        <Text style={styles.sysMsgText}>{chat.text}</Text>
                      </View>
                    );
                  }
                  return (
                    <View key={idx} style={[styles.msgWrapper, isMe ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
                      <View style={[styles.msgBubble, isMe ? { backgroundColor: COLORS.stoneDark } : { backgroundColor: '#e7e5e4' }]}>
                        <Text style={[styles.msgText, isMe ? { color: '#fff' } : { color: '#1c1917' }]}>{chat.text}</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              <View style={styles.chatInputBar}>
                <TextInput style={styles.chatInputText} placeholder="Nhập tin đàm phán..." value={chatInput} onChangeText={setChatInput} />
                <TouchableOpacity style={styles.chatSendBtn} onPress={handleSendChat}>
                  <Ionicons name="send" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {/* FOOTER TAB NAVIGATION CHUẨN ĐIỆN THOẠI */}
      <View style={styles.footerTabBar}>
        <TouchableOpacity style={styles.tabBarItem} onPress={() => setActiveTab('main')}>
          <Ionicons name="briefcase" size={20} color={activeTab === 'main' ? COLORS.orange : '#a8a29e'} />
          <Text style={[styles.tabBarText, { color: activeTab === 'main' ? COLORS.orange : '#a8a29e' }]}>Việc làm</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBarItem} onPress={() => {
          setActiveTab('chat');
          // Tự động lấy đơn đầu tiên để chat nếu có đơn đang chạy
          const activeJobs = jobs.filter(j => j.status !== 'finding');
          if (activeJobs.length > 0 && !activeChatJobId) {
            setActiveChatJobId(activeJobs[0].id);
          }
        }}>
          <Ionicons name="chatbubble-ellipses" size={20} color={activeTab === 'chat' ? COLORS.orange : '#a8a29e'} />
          <Text style={[styles.tabBarText, { color: activeTab === 'chat' ? COLORS.orange : '#a8a29e' }]}>Tin nhắn</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBarItem} onPress={() => setIsLoggedIn(false)}>
          <Ionicons name="log-out" size={20} color="#a8a29e" />
          <Text style={[styles.tabBarText, { color: '#a8a29e' }]}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {/* ==========================================
          MODAL ĐÁNH GIÁ VÀ GIẢI NGÂN (ESCROW ESCAPE)
          ========================================== */}
      <Modal visible={isRatingModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Xác Nhận &amp; Chấm Điểm Uy Tín</Text>
            <Text style={styles.modalSubtitle}>Hệ thống bảo chứng sẽ chuyển thù lao thẳng vào ví của thợ ngay khi bạn duyệt.</Text>

            <View style={styles.inputGroup}>
              <Text style={{ fontSize: 11, fontWeight: '700', marginBottom: 4 }}>Số sao đánh giá (1-5):</Text>
              <TextInput style={styles.mobileInput} value={ratingScore} onChangeText={setRatingScore} keyboardType="numeric" placeholder="Ví dụ: 5" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={{ fontSize: 11, fontWeight: '700', marginBottom: 4 }}>Ý kiến phản hồi:</Text>
              <TextInput style={styles.mobileInput} value={ratingComment} onChangeText={setRatingComment} placeholder="Bạn thợ rất nhanh nhẹn, đúng giờ..." />
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsRatingModalVisible(false)}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#666' }}>Hủy bỏ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleSubmitRating}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#fff' }}>Giải ngân đơn</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ==========================================
// HỆ THỐNG STYLESHEET TỐI ƯU CHO MOBILE APP
// ==========================================
const styles = StyleSheet.create({
  authContainer: { flex: 1, backgroundColor: '#f5f5f4' },
  logoCircle: { width: 70, height: 70, borderRadius: 24, backgroundColor: COLORS.orange, justifyContent: 'center', alignItems: 'center', marginTop: 40, shadowColor: COLORS.orange, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  logoText: { color: '#fff', fontSize: 32, fontWeight: '900' },
  brandTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.stoneDark, marginTop: 16 },
  brandSubtitle: { fontSize: 12, color: COLORS.grayText, textAlign: 'center', paddingHorizontal: 20, marginTop: 4 },
  authSection: { width: '100%', backgroundColor: '#fff', padding: 16, borderRadius: 20, borderWith: 1, borderColor: COLORS.stoneBorder, marginTop: 30 },
  sectionLabel: { fontSize: 10, fontWeight: 'bold', color: '#a8a29e', trackingLetter: 1, marginBottom: 12 },
  quickCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 2, borderRadius: 16, marginBottom: 10, backgroundColor: '#fff' },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, marginRight: 12 },
  quickName: { fontSize: 14, fontWeight: 'bold' },
  quickRole: { fontSize: 12, color: '#666' },
  mobileInput: { width: '100%', height: 42, borderWidth: 1, borderColor: COLORS.stoneBorder, borderRadius: 10, paddingHorizontal: 12, fontSize: 13, backgroundColor: '#fafaf9', marginBottom: 10 },
  roleSelectorRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  roleSelectBtn: { flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.stoneBorder, borderRadius: 10, alignItems: 'center', backgroundColor: '#fff' },
  roleSelectBtnText: { fontSize: 12, fontWeight: 'bold', color: '#444' },
  submitAuthBtn: { width: '100%', height: 44, backgroundColor: COLORS.stoneDark, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  submitAuthBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  
  container: { flex: 1, backgroundColor: '#f5f5f4' },
  header: { height: 64, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.stoneBorder, flexDirection: 'row', justifyContent: 'between', alignItems: 'center', paddingHorizontal: 16 },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1c1917' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  roleBadge: { fontSize: 9, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  walletBadge: { fontSize: 10, fontWeight: 'bold', color: COLORS.orange },
  switchRoleBtn: { backgroundColor: COLORS.stoneDark, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  switchRoleText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  
  workspaceScroll: { flex: 1, padding: 14 },
  infoCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.stoneBorder, marginBottom: 14 },
  infoCardTitle: { fontSize: 11, fontWeight: 'bold', color: '#a8a29e' },
  bigMoney: { fontSize: 22, fontWeight: '900', color: '#1c1917', marginVertical: 4 },
  quickBuyRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  buyBtn: { backgroundColor: COLORS.orange, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  buyBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  
  rolePanel: { width: '100%' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  cardHeaderText: { fontSize: 14, fontWeight: 'bold', color: '#1c1917' },
  mainActionBtn: { backgroundColor: COLORS.orange, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  mainActionBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  
  subTabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.stoneBorder, marginBottom: 12 },
  subTabItem: { paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  subTabItemActive: { borderBottomColor: COLORS.orange },
  subTabText: { fontSize: 12, fontWeight: 'bold', color: '#78716c' },
  
  jobItemCard: { backgroundColor: '#fff', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: COLORS.stoneBorder, marginBottom: 10 },
  jobItemCategory: { alignSelf: 'flex-start', fontSize: 9, fontWeight: 'bold', backgroundColor: COLORS.orangeLight, color: COLORS.orange, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  jobItemTitle: { fontSize: 14, fontWeight: 'bold', color: '#1c1917', marginTop: 6 },
  jobItemLocation: { fontSize: 11, color: '#666', marginTop: 2 },
  jobItemBudget: { fontSize: 13, fontWeight: '800', color: COLORS.orange, marginTop: 4 },
  approveTaskBtn: { backgroundColor: COLORS.orange, paddingVertical: 8, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  approveTaskBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  statusWaitText: { fontSize: 11, color: '#d97706', fontWeight: '500', marginTop: 8 },
  
  radarCard: { backgroundColor: '#1c1917', padding: 14, borderRadius: 14, marginBottom: 14 },
  radarTitle: { color: '#2dd4bf', fontSize: 13, fontWeight: 'bold' },
  radarDesc: { color: '#a8a29e', fontSize: 11, marginTop: 4, leadingLine: 16 },
  
  chatWorkspace: { flex: 1, backgroundColor: '#fff' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  chatHeader: { padding: 12, backgroundColor: '#fafaf9', borderBottomWidth: 1, borderBottomColor: COLORS.stoneBorder },
  chatHeaderTitle: { fontSize: 13, fontWeight: 'bold' },
  chatHeaderSub: { fontSize: 10, color: '#999' },
  chatMessageArea: { flex: 1, backgroundColor: '#f5f5f4' },
  msgWrapper: { flexDirection: 'row', marginBottom: 10 },
  msgBubble: { padding: 10, borderRadius: 12, maxWidth: '80%' },
  msgText: { fontSize: 13 },
  sysMsgBox: { alignSelf: 'center', backgroundColor: '#fef3c7', padding: 8, borderRadius: 8, marginVertical: 10, borderWidth: 1, borderColor: '#fde68a', maxWidth: '90%' },
  sysMsgText: { fontSize: 11, color: '#92400e', textAlign: 'center' },
  chatInputBar: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: COLORS.stoneBorder, alignItems: 'center', backgroundColor: '#fff' },
  chatInputText: { flex: 1, height: 38, borderWidth: 1, borderColor: COLORS.stoneBorder, borderRadius: 18, paddingHorizontal: 14, fontSize: 13 },
  chatSendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.stoneDark, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  
  footerTabBar: { height: 56, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.stoneBorder, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  tabBarItem: { alignItems: 'center', justifyContent: 'center' },
  tabBarText: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  modalSubtitle: { fontSize: 11, color: '#666', textAlign: 'center', marginVertical: 6 },
  inputGroup: { marginTop: 10 },
  modalActionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalCancelBtn: { flex: 1, height: 38, borderWidth: 1, borderColor: COLORS.stoneBorder, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  modalConfirmBtn: { flex: 1, height: 38, backgroundColor: COLORS.orange, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
});