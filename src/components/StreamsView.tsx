@@ .. @@
   return (
     <div className="space-y-6">
-      <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 p-6">
+      <div className="card">
+        <div className="card-header">
         <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-2">
             <Calendar className="w-5 h-5 text-purple-400" />
@@ -1,7 +1,7 @@
           </div>
           {isSpaceOwner && (
             <button
               onClick={() => setShowCreateForm(true)}
     )
     }
   )
-              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              className="btn-primary bg-purple-600 hover:bg-purple-700"
+              className="btn-primary bg-purple-600 hover:bg-purple-700"
             >
               <Plus className="w-4 h-4" />
               Schedule Stream
@@ -1,7 +1,7 @@
           )}
         </div>
+        </div>

+        <div className="card-body">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
-          <div className="bg-purple-900/50 backdrop-blur-sm border border-purple-700 rounded-lg p-4">
+          <div className="bg-purple-900/30 border border-purple-800 rounded-lg p-4">
             <div className="text-2xl font-bold text-purple-600">{upcomingStreams.length}</div>
             <div className="text-sm text-purple-300">Upcoming Streams</div>
           </div>
-          <div className="bg-green-900/50 backdrop-blur-sm border border-green-700 rounded-lg p-4">
+          <div className="bg-green-900/30 border border-green-800 rounded-lg p-4">
             <div className="text-2xl font-bold text-green-600">
               {upcomingStreams.reduce((acc, stream) => 
                 acc + stream.rsvps.filter(rsvp => rsvp.status === 'attending').length, 0
)
}
@@ -1,7 +1,7 @@
             </div>
             <div className="text-sm text-green-300">Total Attendees</div>
           </div>
-          <div className="bg-blue-900/50 backdrop-blur-sm border border-blue-700 rounded-lg p-4">
          <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4">
+          <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4">
             <div className="text-2xl font-bold text-blue-600">{pastStreams.length}</div>
             <div className="text-sm text-blue-300">Past Streams</div>
           </div>
         </div>
+        </div>
       </div>