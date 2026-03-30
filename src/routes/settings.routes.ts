import { Router } from 'express';
const router = Router();
import prisma from '../config/prisma';
// Get public site settings
router.get('/public', async (req, res) => {
    try {
        const [frontSettings, globalSettings] = await Promise.all([
            prisma.frontCmsSetting.findFirst(),
            prisma.globalSettings.findFirst()
        ]);

        const settings = {
            title: frontSettings?.application_title || globalSettings?.institute_name || 'SSFI',
            logo: frontSettings?.logo,
            favIcon: frontSettings?.fav_icon,

            contact: {
                address: frontSettings?.address || globalSettings?.address,
                phone: frontSettings?.mobile_no || globalSettings?.mobileno,
                email: frontSettings?.email || frontSettings?.receive_contact_email || globalSettings?.institute_email,
                workingHours: frontSettings?.working_hours
            },

            social: {
                facebook: frontSettings?.facebook_url || globalSettings?.facebook_url,
                twitter: frontSettings?.twitter_url || globalSettings?.twitter_url,
                youtube: frontSettings?.youtube_url || globalSettings?.youtube_url,
                instagram: frontSettings?.instagram_url,
                linkedin: frontSettings?.linkedin_url || globalSettings?.linkedin_url
            },

            theme: {
                primaryColor: frontSettings?.primary_color,
                menuColor: frontSettings?.menu_color,
                // footerText: frontSettings?.footer_text || globalSettings?.footer_text
            }
        };

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Settings fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch settings'
        });
    }
});

export default router;
