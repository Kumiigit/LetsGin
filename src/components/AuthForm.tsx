@@ .. @@
   if (mode === 'select') {
     return (
-      <div className="min-h-screen bg-transparent flex items-center justify-center">
-        <div className="bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 w-full max-w-md mx-4">
+      <div className="min-h-screen bg-black flex items-center justify-center">
+        <div className="card w-full max-w-md mx-4 scale-in">
           <div className="p-8">
             <div className="text-center mb-8">
               <div className="flex items-center justify-center mb-4">
@@ -1,7 +1,7 @@
             <div className="space-y-4">
               <button
                 onClick={() => handleModeSelect('host')}
-                className="w-full p-6 bg-blue-600/20 border-2 border-blue-600 rounded-lg hover:bg-blue-600/30 transition-colors group"
+                className="w-full p-6 bg-blue-600/20 border-2 border-blue-600 rounded-lg hover:bg-blue-600/40 transition-all duration-200 group hover:scale-105"
               >
                 <div className="flex items-center gap-4">
                   <Users className="w-8 h-8 text-blue-400 group-hover:text-blue-300" />
@@ -1,7 +1,7 @@
               </button>

               <button
                 onClick={() => handleModeSelect('join')}
-                className="w-full p-6 bg-purple-600/20 border-2 border-purple-600 rounded-lg hover:bg-purple-600/30 transition-colors group"
+                className="w-full p-6 bg-purple-600/20 border-2 border-purple-600 rounded-lg hover:bg-purple-600/40 transition-all duration-200 group hover:scale-105"
               >
                 <div className="flex items-center gap-4">
                   <Search className="w-8 h-8 text-purple-400 group-hover:text-purple-300" />
@@ .. @@
   return (
-    <div className="min-h-screen bg-transparent flex items-center justify-center">
-      <div className="bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 w-full max-w-md mx-4">
+    <div className="min-h-screen bg-black flex items-center justify-center">
+      <div className="card w-full max-w-md mx-4 scale-in">
         <div className="p-8">
           <div className="text-center mb-8">
             <div className="flex items-center justify-center mb-4">
@@ .. @@
           {error && (
-            <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-lg">
+            <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-lg">
               <p className="text-red-300 text-sm">{error}</p>
             </div>
           )}
@@ .. @@
                   <input
                     type="text"
                     value={fullName}
                     onChange={(e) => setFullName(e.target.value)}
-                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
+                    className="form-input pl-10"
                     placeholder="Enter your full name"
                     required={isSignUp}
                   />
@@ .. @@
                 <input
                   type="email"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
-                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
+                  className="form-input pl-10"
                   placeholder="Enter your email"
                   required
                 />
@@ .. @@
                 <input
                   type="password"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
-                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
+                  className="form-input pl-10"
                   placeholder="Enter your password"
                   required
                   minLength={6}
@@ .. @@
                   <input
                     type="password"
                     value={adminPassword}
                     onChange={(e) => setAdminPassword(e.target.value)}
-                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
+                    className="form-input pl-10"
                     placeholder="Enter admin password"
                     required={isSignUp && mode === 'host'}
                   />
@@ .. @@
             <button
               type="submit"
               disabled={submitting}
-              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
+              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {submitting ? (
-                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
+                <div className="spinner border-white" />
               ) : (
                 <>
                   {isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}