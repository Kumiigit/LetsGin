@@ .. @@
   return (
   )
-    <div className="flex items-center justify-between bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 p-4">
    <div className="flex items-center justify-between bg-gray-900 rounded-lg shadow-2xl border border-gray-800 p-6">
+    <div className="flex items-center justify-between bg-gray-900 rounded-lg shadow-2xl border border-gray-800 p-6">
       <div className="flex items-center gap-4">
         <button
           onClick={onToday}
-          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
+          className="btn-primary text-sm"
         >
           <Calendar className="w-4 h-4" />
           Today
         </button>
         <div className="flex items-center gap-2">
           <button
             onClick={onPreviousWeek}
-            className="p-2 text-gray-300 hover:bg-gray-700 rounded-md transition-colors"
+            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
           >
             <ChevronLeft className="w-5 h-5" />
           </button>
-          <h2 className="text-lg font-semibold text-white min-w-0">
+          <h2 className="text-xl font-bold text-white min-w-0">
             {formatDateRange()}
           </h2>
           <button
             onClick={onNextWeek}
-            className="p-2 text-gray-300 hover:bg-gray-700 rounded-md transition-colors"
+            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
           >
             <ChevronRight className="w-5 h-5" />
           </button>