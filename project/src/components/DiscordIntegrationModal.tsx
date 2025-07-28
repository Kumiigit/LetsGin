import React, { useState } from 'react';
import { X, Plus, Trash2, Settings, Send, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { Space, DiscordWebhook } from '../types';
import { useDiscordWebhooks } from '../hooks/useDiscordWebhooks';

interface DiscordIntegrationModalProps {
  space: Space;
  onClose: () => void;
}

export const DiscordIntegrationModal: React.FC<DiscordIntegrationModalProps> = ({
  space,
  onClose,
}) => {
  const { webhooks, loading, createWebhook, updateWebhook, deleteWebhook, testWebhook } = useDiscordWebhooks(space.id);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<string | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    webhookUrl: '',
    webhookName: '',
    autoPostStreams: true,
    postTiming: 'on_creation' as 'on_creation' | 'before_stream' | 'both',
    minutesBefore: 60,
  });

  const resetForm = () => {
    setFormData({
      webhookUrl: '',
      webhookName: '',
      autoPostStreams: true,
      postTiming: 'on_creation',
      minutesBefore: 60,
    });
    setShowCreateForm(false);
    setEditingWebhook(null);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (editingWebhook) {
        await updateWebhook(editingWebhook, {
          webhookName: formData.webhookName || undefined,
          autoPostStreams: formData.autoPostStreams,
          postTiming: formData.postTiming,
          minutesBefore: formData.minutesBefore,
        });
        setSuccess('Webhook updated successfully!');
      } else {
        await createWebhook(formData);
        setSuccess('Webhook created successfully!');
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save webhook');
    }
  };

  const handleEdit = (webhook: DiscordWebhook) => {
    setFormData({
      webhookUrl: webhook.webhookUrl,
      webhookName: webhook.webhookName || '',
      autoPostStreams: webhook.autoPostStreams,
      postTiming: webhook.postTiming,
      minutesBefore: webhook.minutesBefore,
    });
    setEditingWebhook(webhook.id);
    setShowCreateForm(true);
  };

  const handleDelete = async (webhookId: string) => {
    if (confirm('Are you sure you want to delete this webhook?')) {
      try {
        await deleteWebhook(webhookId);
        setSuccess('Webhook deleted successfully!');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete webhook');
      }
    }
  };

  const handleTest = async (webhookUrl: string, webhookId: string) => {
    setTestingWebhook(webhookId);
    setError(null);
    setSuccess(null);

    try {
      await testWebhook(webhookUrl);
      setSuccess('Test message sent successfully! Check your Discord channel.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Webhook test failed');
    } finally {
      setTestingWebhook(null);
    }
  };

  const validateWebhookUrl = (url: string): boolean => {
    return url.startsWith('https://discord.com/api/webhooks/') || url.startsWith('https://discordapp.com/api/webhooks/');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-black border border-gray-800 rounded-lg shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">D</span>
            </div>
            <h3 className="text-xl font-semibold text-white">Discord Integration</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Status Messages */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-900/20 border border-red-800 rounded-lg mb-6">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-300">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-4 bg-green-900/20 border border-green-800 rounded-lg mb-6">
              <Check className="w-5 h-5 text-green-400" />
              <span className="text-green-300">{success}</span>
            </div>
          )}

          {/* Setup Instructions */}
          <div className="bg-gray-900 rounded-lg p-6 mb-6">
            <h4 className="text-lg font-medium text-white mb-4">Setup Instructions</h4>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <p className="font-medium">Create a Discord Webhook</p>
                  <p className="text-gray-400">Go to your Discord server → Channel Settings → Integrations → Webhooks → New Webhook</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <p className="font-medium">Copy the Webhook URL</p>
                  <p className="text-gray-400">Click "Copy Webhook URL" and paste it in the form below</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <div>
                  <p className="font-medium">Configure Settings</p>
                  <p className="text-gray-400">Choose when to post messages and test the integration</p>
                </div>
              </div>
            </div>
            <a
              href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Learn more about Discord Webhooks
            </a>
          </div>

          {/* Existing Webhooks */}
          {webhooks.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-medium text-white mb-4">Configured Webhooks</h4>
              <div className="space-y-4">
                {webhooks.map((webhook) => (
                  <div key={webhook.id} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h5 className="font-medium text-white">
                          {webhook.webhookName || 'Unnamed Webhook'}
                        </h5>
                        <p className="text-sm text-gray-400">
                          {webhook.webhookUrl.substring(0, 50)}...
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          webhook.isActive 
                            ? 'bg-green-900/50 text-green-300 border border-green-800' 
                            : 'bg-gray-800 text-gray-400 border border-gray-700'
                        }`}>
                          {webhook.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-400">Auto-post streams:</span>
                        <span className="ml-2 text-white">
                          {webhook.autoPostStreams ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Post timing:</span>
                        <span className="ml-2 text-white capitalize">
                          {webhook.postTiming.replace('_', ' ')}
                        </span>
                      </div>
                      {webhook.postTiming !== 'on_creation' && (
                        <div>
                          <span className="text-gray-400">Minutes before:</span>
                          <span className="ml-2 text-white">{webhook.minutesBefore}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTest(webhook.webhookUrl, webhook.id)}
                        disabled={testingWebhook === webhook.id}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {testingWebhook === webhook.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Test
                      </button>
                      <button
                        onClick={() => handleEdit(webhook)}
                        className="flex items-center gap-2 px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors text-sm"
                      >
                        <Settings className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(webhook.id)}
                        className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add/Edit Webhook Form */}
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Discord Webhook
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="bg-gray-900 rounded-lg p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-white">
                  {editingWebhook ? 'Edit Webhook' : 'Add New Webhook'}
                </h4>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Webhook URL *
                    </label>
                    <input
                      type="url"
                      value={formData.webhookUrl}
                      onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                      placeholder="https://discord.com/api/webhooks/..."
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={!!editingWebhook}
                    />
                    {formData.webhookUrl && !validateWebhookUrl(formData.webhookUrl) && (
                      <p className="text-red-400 text-sm mt-1">
                        Please enter a valid Discord webhook URL
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Webhook Name
                    </label>
                    <input
                      type="text"
                      value={formData.webhookName}
                      onChange={(e) => setFormData({ ...formData, webhookName: e.target.value })}
                      placeholder="e.g., Stream Announcements"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Post Timing
                    </label>
                    <select
                      value={formData.postTiming}
                      onChange={(e) => setFormData({ ...formData, postTiming: e.target.value as any })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="on_creation">When stream is created</option>
                      <option value="before_stream">Before stream starts</option>
                      <option value="both">Both times</option>
                    </select>
                  </div>

                  {formData.postTiming !== 'on_creation' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Minutes Before Stream
                      </label>
                      <input
                        type="number"
                        value={formData.minutesBefore}
                        onChange={(e) => setFormData({ ...formData, minutesBefore: parseInt(e.target.value) || 60 })}
                        min="1"
                        max="1440"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.autoPostStreams}
                    onChange={(e) => setFormData({ ...formData, autoPostStreams: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-300">
                    Automatically post new streams to Discord
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={!formData.webhookUrl || !validateWebhookUrl(formData.webhookUrl)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {editingWebhook ? 'Update Webhook' : 'Add Webhook'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};