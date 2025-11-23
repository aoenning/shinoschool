import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

const AuthContext = createContext({});

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null); // 'admin' | 'student' | null
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Hardcoded Super Admin for development/testing
                if (firebaseUser.email === 'and.oenning@gmail.com') {
                    console.log("Super Admin detected");

                    // Check if admin also has a student profile
                    const studentsRef = collection(db, "students");
                    const qStudent = query(studentsRef, where("email", "==", firebaseUser.email));
                    const studentSnap = await getDocs(qStudent);

                    if (!studentSnap.empty) {
                        console.log("Admin also has student profile");
                        setRole('admin');
                        setUser({ ...firebaseUser, ...studentSnap.docs[0].data(), id: studentSnap.docs[0].id, isAdmin: true });
                    } else {
                        setRole('admin');
                        setUser({ ...firebaseUser, isAdmin: true });
                    }
                    setLoading(false);
                    return;
                }

                // 1. Check if user is an admin
                const adminsRef = collection(db, "admins");
                const qAdmin = query(adminsRef, where("email", "==", firebaseUser.email));
                const adminSnap = await getDocs(qAdmin);

                if (!adminSnap.empty) {
                    console.log("User identified as Admin");

                    // Check if admin also has a student profile
                    const studentsRef = collection(db, "students");
                    const qStudent = query(studentsRef, where("email", "==", firebaseUser.email));
                    const studentSnap = await getDocs(qStudent);

                    if (!studentSnap.empty) {
                        console.log("Admin also has student profile");
                        setRole('admin');
                        setUser({ ...firebaseUser, ...studentSnap.docs[0].data(), id: studentSnap.docs[0].id, isAdmin: true });
                    } else {
                        setRole('admin');
                        setUser({ ...firebaseUser, isAdmin: true });
                    }
                } else {
                    // 2. Check if user is a student
                    const studentsRef = collection(db, "students");
                    const qStudent = query(studentsRef, where("email", "==", firebaseUser.email));
                    const studentSnap = await getDocs(qStudent);

                    if (!studentSnap.empty) {
                        console.log("User identified as Student");
                        setRole('student');
                        setUser({ ...firebaseUser, ...studentSnap.docs[0].data(), id: studentSnap.docs[0].id });
                    } else {
                        console.log("User has no role assigned - Defaulting to Admin (Temporary)");
                        setRole('admin'); // Temporary: Allow access as admin if no profile found
                        setUser(firebaseUser);
                    }
                }
            } else {
                setUser(null);
                setRole(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const signup = (email, password) => {
        return createUserWithEmailAndPassword(auth, email, password);
    };

    const logout = () => {
        return signOut(auth);
    };

    const value = {
        user,
        role,
        isAdmin: role === 'admin',
        isStudent: role === 'student',
        login,
        signup,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
