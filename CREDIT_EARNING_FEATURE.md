# Credit Earning Questionnaire Feature

## 📋 Overview
A gamified survey system where users earn credits by answering profile questions. Questions appear one at a time with smooth animations and instant reward feedback.

---

## ✨ What You Asked For

### 1. **Questions List** (11 Total)
- Are you married?
- Do you have a bike?
- Do you have a car?
- Are you a housewife?
- Are you currently studying?
- Are you on a job?
- Do you own a business?
- Are you a freelancer?
- What languages can you speak, read, and type?
- Are you looking for a job?
- What is your pincode?

### 2. **Credit Rewards System**
- ✅ **20 credits** per question answered
- 🏆 **100 bonus credits** when all questions are completed
- Credits automatically added to user's account
- Real-time credit balance display

### 3. **User Experience**
- ✅ One question at a time (progressive disclosure)
- ✅ Optional to answer - can skip any question
- ✅ Smooth animations between questions
- ✅ Progress bar showing completion percentage
- ✅ Instant reward feedback after each answer
- ✅ Beautiful gradient design with icons

### 4. **Question Types**
- **Yes/No Questions** - Two big buttons (9 questions)
- **Text Input Questions** - Text field with submit button (2 questions: languages & pincode)

---

## 🎨 UI Components Created

### 1. **Profile Page Section** (`profile.tsx`)
```
┌─────────────────────────────────┐
│  🎁 Earn More Credits!          │
│  Answer questions and get       │
│  rewarded                       │
│                                 │
│  ✓ 20 credits per question      │
│  🏆 100 credits for all!        │
│                                 │
│  [   Start Earning   →   ]     │
└─────────────────────────────────┘
```
- Eye-catching green gradient card
- Shows reward structure
- Button navigates to questionnaire

### 2. **Earn Credits Screen** (`profile/earn-credits.tsx`)
```
┌─────────────────────────────────┐
│ ← Earn Credits        🎁 120    │
├─────────────────────────────────┤
│ Question 5 of 11         45%    │
│ ████████░░░░░░░░░░░░░░░░        │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐ │
│  │ Q5                        │ │
│  │ Are you currently         │ │
│  │ studying?                 │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌──────────┐  ┌──────────┐   │
│  │ ✓ Yes    │  │ ✗ No     │   │
│  └──────────┘  └──────────┘   │
│                                 │
│  🎁 Earn 20 credits for this    │
│     answer                      │
│                                 │
│     Skip this question →        │
│                                 │
└─────────────────────────────────┘
```

**Features:**
- Header with back button and current credits
- Progress bar with percentage
- Animated question cards
- Large, easy-to-tap buttons
- Skip option for every question
- Reward reminder

---

## 🗄️ Database Structure Needed

### Backend API Endpoints Required:

#### 1. **GET** `/user/survey-progress`
**Response:**
```json
{
  "success": true,
  "data": {
    "answeredQuestions": ["married", "haveBike", "onJob"],
    "totalEarned": 60,
    "answers": {
      "married": "Yes",
      "haveBike": "No",
      "onJob": "Yes"
    }
  }
}
```

#### 2. **POST** `/user/survey-answer`
**Request:**
```json
{
  "questionKey": "married",
  "answer": "Yes"
}
```

**Response:**
```json
{
  "success": true,
  "creditsEarned": 20,
  "bonusEarned": 0,
  "totalCredits": 120,
  "allCompleted": false
}
```

**When all questions completed:**
```json
{
  "success": true,
  "creditsEarned": 20,
  "bonusEarned": 100,
  "totalCredits": 220,
  "allCompleted": true
}
```

---

## 📊 Database Schema

### User Schema Addition:
```javascript
{
  // Existing fields...
  
  // Survey/Questionnaire fields
  surveyAnswers: {
    married: String,           // "Yes" | "No"
    haveBike: String,          // "Yes" | "No"
    haveCar: String,           // "Yes" | "No"
    houseWife: String,         // "Yes" | "No"
    studying: String,          // "Yes" | "No"
    onJob: String,             // "Yes" | "No"
    business: String,          // "Yes" | "No"
    freeLancer: String,        // "Yes" | "No"
    languages: String,         // Free text
    wantJob: String,           // "Yes" | "No"
    pincode: String            // Free text
  },
  
  surveyProgress: {
    answeredQuestions: [String],   // Array of question keys answered
    totalEarned: Number,            // Total credits earned from survey
    completedAt: Date,              // When all questions were completed
    lastAnsweredAt: Date            // Last activity timestamp
  }
}
```

---

## 🔄 User Flow

```
1. User opens Profile
   ↓
2. Sees "Earn More Credits" card
   ↓
3. Taps "Start Earning"
   ↓
4. Questionnaire screen opens
   ↓
5. Shows first unanswered question
   ↓
6. User answers (or skips)
   ↓
7. Backend saves answer & awards 20 credits
   ↓
8. Alert: "🎉 You earned 20 credits!"
   ↓
9. Next question appears
   ↓
10. Repeat until all answered OR user exits
    ↓
11. If all completed:
    Alert: "🎊 You earned 100 bonus credits!"
    Total: 11 × 20 + 100 = 320 credits
```

---

## 🎯 Business Logic

### Credit Calculation:
- **Per Question:** 20 credits immediately on answer
- **Completion Bonus:** 100 credits when all 11 answered
- **Total Possible:** 11 × 20 + 100 = **320 credits**

### Duplicate Prevention:
- Each question can only be answered once
- Backend checks if user already answered
- Frontend skips already-answered questions

### Optional Answers:
- No questions are mandatory
- Users can skip any/all questions
- Partial completion is valid
- Can return later to answer more

---

## 🎨 Design Highlights

1. **Gradient Cards** - Modern, colorful UI
2. **Icons** - Visual feedback for every action
3. **Animations** - Smooth transitions between questions
4. **Progress Bar** - Clear visual progress
5. **Instant Feedback** - Alert on every successful answer
6. **Responsive** - Works on all screen sizes

---

## 🔧 Next Steps (Backend Implementation)

1. **Add fields to User model** (surveyAnswers, surveyProgress)
2. **Create API endpoint:** `GET /user/survey-progress`
3. **Create API endpoint:** `POST /user/survey-answer`
4. **Implement credit addition logic**
5. **Prevent duplicate answers** (check if already answered)
6. **Track completion bonus** (100 credits when all answered)
7. **Update user's credit balance** in real-time

---

## 📱 Files Modified/Created

### Modified:
- `InstantllyCards/app/(tabs)/profile.tsx`
  - Added "Earn Credits" card section
  - Added navigation to earn-credits screen
  - Added styles for the new card

### Created:
- `InstantllyCards/app/profile/earn-credits.tsx`
  - Complete questionnaire screen
  - Question flow logic
  - API integration (ready for backend)
  - Animations and UI components

---

## 🧪 Testing Checklist

- [ ] Profile page shows "Earn More Credits" card
- [ ] Tapping card opens questionnaire screen
- [ ] Questions appear one at a time
- [ ] Yes/No buttons work correctly
- [ ] Text input questions accept input
- [ ] Skip button moves to next question
- [ ] Progress bar updates correctly
- [ ] API calls send correct data
- [ ] Credits are added to user account
- [ ] Completion bonus awarded when all answered
- [ ] Cannot answer same question twice
- [ ] Can resume partially completed survey

---

## 💡 Future Enhancements (Optional)

1. Add more question types (multiple choice, rating scale)
2. Personalized questions based on previous answers
3. Analytics dashboard for collected data
4. Time-limited special bonus questions
5. Share survey completion on social media
6. Leaderboard for most surveys completed
