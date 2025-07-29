import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DiscordWebhook, StreamDiscordPost } from '../types';

export function useDiscordWebhooks(spaceId?: string) {
  const [webhooks, setWebhooks] = useState<DiscordWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (spaceId) {
      loadWebhooks();
    } else {
      setLoading(false);
    }
  }, [spaceId]);

  const loadWebhooks = async () => {
    if (!spaceId) return;

    try {
      setError(null);
      const { data, error } = await supabase
        .from('discord_webhooks')
        .select('*')
        .eq('space_id', spaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const convertedWebhooks: DiscordWebhook[] = (data || []).map(webhook => ({
        id: webhook.id,
        spaceId: webhook.space_id,
        webhookUrl: webhook.webhook_url,
        webhookName: webhook.webhook_name,
        isActive: webhook.is_active,
        autoPostStreams: webhook.auto_post_streams,
        postTiming: webhook.post_timing,
        minutesBefore: webhook.minutes_before,
        createdBy: webhook.created_by,
        createdAt: webhook.created_at,
        updatedAt: webhook.updated_at,
      }));

      setWebhooks(convertedWebhooks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  const createWebhook = async (webhookData: {
    webhookUrl: string;
    webhookName?: string;
    autoPostStreams?: boolean;
    postTiming?: 'on_creation' | 'before_stream' | 'both';
    minutesBefore?: number;
  }): Promise<DiscordWebhook> => {
    if (!spaceId) throw new Error('No space selected');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('discord_webhooks')
        .insert({
          space_id: spaceId,
          webhook_url: webhookData.webhookUrl,
          webhook_name: webhookData.webhookName,
          auto_post_streams: webhookData.autoPostStreams ?? true,
          post_timing: webhookData.postTiming ?? 'on_creation',
          minutes_before: webhookData.minutesBefore ?? 60,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const newWebhook: DiscordWebhook = {
        id: data.id,
        spaceId: data.space_id,
        webhookUrl: data.webhook_url,
        webhookName: data.webhook_name,
        isActive: data.is_active,
        autoPostStreams: data.auto_post_streams,
        postTiming: data.post_timing,
        minutesBefore: data.minutes_before,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      await loadWebhooks();
      return newWebhook;
    } catch (err) {
      throw err;
    }
  };

  const updateWebhook = async (
    webhookId: string,
    updates: Partial<Pick<DiscordWebhook, 'webhookName' | 'isActive' | 'autoPostStreams' | 'postTiming' | 'minutesBefore'>>
  ) => {
    try {
      const updateData: any = {};
      if (updates.webhookName !== undefined) updateData.webhook_name = updates.webhookName;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.autoPostStreams !== undefined) updateData.auto_post_streams = updates.autoPostStreams;
      if (updates.postTiming !== undefined) updateData.post_timing = updates.postTiming;
      if (updates.minutesBefore !== undefined) updateData.minutes_before = updates.minutesBefore;

      const { error } = await supabase
        .from('discord_webhooks')
        .update(updateData)
        .eq('id', webhookId);

      if (error) throw error;
      await loadWebhooks();
    } catch (err) {
      throw err;
    }
  };

  const deleteWebhook = async (webhookId: string) => {
    try {
      const { error } = await supabase
        .from('discord_webhooks')
        .delete()
        .eq('id', webhookId);

      if (error) throw error;
      await loadWebhooks();
    } catch (err) {
      throw err;
    }
  };

  const testWebhook = async (webhookUrl: string): Promise<boolean> => {
    try {
      const testMessage = {
        content: "🎮 **Test Message from Staff Availability Manager**\n\nThis is a test to verify your Discord webhook is working correctly!",
        embeds: [{
          title: "Webhook Test Successful",
          description: "Your Discord integration is properly configured.",
          color: 0x00ff00,
          timestamp: new Date().toISOString(),
        }]
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testMessage),
      });

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.status} ${response.statusText}`);
      }

      return true;
    } catch (err) {
      throw new Error(`Webhook test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const postStreamToDiscord = async (
    streamData: any,
    webhookId: string,
    postType: 'creation' | 'reminder'
  ): Promise<StreamDiscordPost> => {
    try {
      // Get webhook details
      const webhook = webhooks.find(w => w.id === webhookId);
      if (!webhook) throw new Error('Webhook not found');

      // Format stream data for Discord
      const streamDate = new Date(`${streamData.date}T${streamData.start_time}`);
      
      const casters = streamData.stream_assignments
        .filter((a: any) => a.role === 'caster')
        .map((a: any) => a.staff_members.name);
      
      const observers = streamData.stream_assignments
        .filter((a: any) => a.role === 'observer')
        .map((a: any) => a.staff_members.name);

      const production = streamData.stream_assignments
        .filter((a: any) => a.role === 'production')
        .map((a: any) => a.staff_members.name);

      const discordMessage = {
        embeds: [{
          title: `🎮 ${streamData.title}`,
          description: streamData.description || 'No description provided',
          color: postType === 'creation' ? 0x00ff00 : 0xffaa00,
          fields: [
            {
              name: "📅 Date & Time",
              value: `<t:${Math.floor(streamDate.getTime() / 1000)}:F>\n<t:${Math.floor(streamDate.getTime() / 1000)}:R>`,
              inline: true
            },
            {
              name: "🎯 Status",
              value: streamData.status.charAt(0).toUpperCase() + streamData.status.slice(1),
              inline: true
            }
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: postType === 'creation' ? 'Stream Created' : 'Stream Reminder'
          }
        }]
      };

      if (casters.length > 0) {
        discordMessage.embeds[0].fields.push({
          name: "🎤 Casters",
          value: casters.join(', '),
          inline: true
        });
      }

      if (observers.length > 0) {
        discordMessage.embeds[0].fields.push({
          name: "👀 Observers",
          value: observers.join(', '),
          inline: true
        });
      }

      if (production.length > 0) {
        discordMessage.embeds[0].fields.push({
          name: "🎬 Production",
          value: production.join(', '),
          inline: true
        });
      }

      if (streamData.stream_link) {
        discordMessage.embeds[0].fields.push({
          name: "🔗 Stream Link",
          value: `[Join Stream](${streamData.stream_link})`,
          inline: false
        });
      }

      // Send to Discord
      const response = await fetch(webhook.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(discordMessage),
      });

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.status} ${response.statusText}`);
      }

      // Get the Discord message ID from the response
      const discordResponse = await response.json();
      const discordMessageId = discordResponse.id;

      // Record the post
      const { data: postData, error: postError } = await supabase
        .from('stream_discord_posts')
        .insert({
          stream_id: streamData.id,
          webhook_id: webhookId,
          discord_message_id: discordMessageId,
          post_type: postType,
          success: true,
        })
        .select()
        .single();

      if (postError) throw postError;

      return {
        id: postData.id,
        streamId: postData.stream_id,
        webhookId: postData.webhook_id,
        discordMessageId: postData.discord_message_id,
        postType: postData.post_type,
        postedAt: postData.posted_at,
        success: postData.success,
        errorMessage: postData.error_message,
        createdAt: postData.created_at,
      };
    } catch (err) {
      // Record failed post
      await supabase
        .from('stream_discord_posts')
        .insert({
          stream_id: streamData.id,
          webhook_id: webhookId,
          post_type: postType,
          success: false,
          error_message: err instanceof Error ? err.message : 'Unknown error',
        });

      throw err;
    }
  };

  const editStreamDiscordPost = async (
    streamData: any,
    webhookId: string,
    discordMessageId: string
  ): Promise<void> => {
    try {
      // Get webhook details
      const webhook = webhooks.find(w => w.id === webhookId);
      if (!webhook) throw new Error('Webhook not found');

      // Format stream data for Discord
      const streamDate = new Date(`${streamData.date}T${streamData.start_time}`);
      
      const casters = streamData.stream_assignments
        .filter((a: any) => a.role === 'caster')
        .map((a: any) => a.staff_members.name);
      
      const observers = streamData.stream_assignments
        .filter((a: any) => a.role === 'observer')
        .map((a: any) => a.staff_members.name);

      const production = streamData.stream_assignments
        .filter((a: any) => a.role === 'production')
        .map((a: any) => a.staff_members.name);

      const discordMessage = {
        embeds: [{
          title: `🎮 ${streamData.title} (Updated)`,
          description: streamData.description || 'No description provided',
          color: 0x0099ff, // Blue color for updates
          fields: [
            {
              name: "📅 Date & Time",
              value: `<t:${Math.floor(streamDate.getTime() / 1000)}:F>\n<t:${Math.floor(streamDate.getTime() / 1000)}:R>`,
              inline: true
            },
            {
              name: "🎯 Status",
              value: streamData.status.charAt(0).toUpperCase() + streamData.status.slice(1),
              inline: true
            }
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: 'Stream Updated'
          }
        }]
      };

      if (casters.length > 0) {
        discordMessage.embeds[0].fields.push({
          name: "🎤 Casters",
          value: casters.join(', '),
          inline: true
        });
      }

      if (observers.length > 0) {
        discordMessage.embeds[0].fields.push({
          name: "👀 Observers",
          value: observers.join(', '),
          inline: true
        });
      }

      if (production.length > 0) {
        discordMessage.embeds[0].fields.push({
          name: "🎬 Production",
          value: production.join(', '),
          inline: true
        });
      }

      if (streamData.stream_link) {
        discordMessage.embeds[0].fields.push({
          name: "🔗 Stream Link",
          value: `[Join Stream](${streamData.stream_link})`,
          inline: false
        });
      }

      // Update Discord message
      const response = await fetch(`${webhook.webhookUrl}/messages/${discordMessageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(discordMessage),
      });

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.status} ${response.statusText}`);
      }

      console.log('Discord message updated successfully');
    } catch (err) {
      console.error('Failed to update Discord message:', err);
      throw err;
    }
  };

  return {
    webhooks,
    loading,
    error,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    postStreamToDiscord,
    editStreamDiscordPost,
    refreshWebhooks: loadWebhooks,
  };
}