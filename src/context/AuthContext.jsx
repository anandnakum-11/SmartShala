import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { getIdFieldName } from '../utils/idGenerator';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setCurrentUser(user);
          // Fetch user role from Firestore
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              setUserRole(userDoc.data().role);
            } else {
              setUserRole(null);
            }
          } catch (error) {
            console.error('Error fetching user role:', error);
            setUserRole(null);
          }
        } else {
          setCurrentUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setCurrentUser(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (emailOrId, password) => {
    let email = emailOrId;
    
    // Check if input is an ID (contains STU-, PAR-, or TEA-)
    if (emailOrId.includes('STU-') || emailOrId.includes('PAR-') || emailOrId.includes('TEA-')) {
      // Find user by ID in Firestore
      const idFields = ['studentId', 'parentId', 'teacherId'];
      let userFound = null;
      
      for (const idField of idFields) {
        const q = query(collection(db, 'users'), where(idField, '==', emailOrId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          userFound = querySnapshot.docs[0].data();
          email = userFound.email;
          break;
        }
      }
      
      if (!userFound) {
        throw new Error('Invalid ID. Please check your ID and try again.');
      }
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

    let role = null;
    if (userDoc.exists()) {
      role = userDoc.data().role;
      setUserRole(role);
    }

    return { userCredential, role };
  };

  const register = async (email, password, role, additionalData = {}) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Get the ID field name based on role
    const idFieldName = getIdFieldName(role);
    
    // Create user document in Firestore
    const userData = {
      email,
      role,
      createdAt: new Date().toISOString(),
      ...additionalData
    };
    
    // Ensure the ID field is set
    if (!userData[idFieldName]) {
      throw new Error(`${idFieldName} is required for ${role} registration`);
    }
    
    await setDoc(doc(db, 'users', userCredential.user.uid), userData);

    setUserRole(role);
    return userCredential;
  };

  const logout = async () => {
    await signOut(auth);
    setUserRole(null);
  };

  const value = {
    currentUser,
    userRole,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};




