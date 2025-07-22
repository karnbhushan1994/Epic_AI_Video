import React from 'react';
import {
    Page,
    Card,
    Grid,
    BlockStack,
    InlineStack,
    Text,
    Badge,
    Button,
    ProgressBar,
    Icon,
    Box,
    Divider,
    Banner,
    Avatar,
    Thumbnail
} from '@shopify/polaris';
import {
    PlayIcon,
    ImageIcon,
    ArrowUpIcon,
    HeartIcon,
    ClockIcon,
    StarIcon,
    ChartVerticalIcon,
    CalendarIcon,
    ThumbsUpIcon,
    ViewIcon,
    ArrowDownIcon,
    ShareIcon,
    PlusIcon,
    SearchIcon
} from '@shopify/polaris-icons';

const Dashboard = () => {
    // Static data for the dashboard
    const stats = {
        totalProjects: 142,
        videoTemplates: 89,
        imageTemplates: 53,
        totalViews: 12847,
        totalLikes: 2341,
        totalDownloads: 5623,
        weeklyGrowth: '+24%'
    };

    const recentProjects = [
        {
            id: 1,
            name: 'Summer Collection Showcase',
            type: 'video',
            category: 'Fashion',
            status: 'Published',
            views: 1247,
            likes: 89,
            createdAt: '2 hours ago',
            thumbnail: 'https://via.placeholder.com/60x60/6366f1/ffffff?text=V'
        },
        {
            id: 2,
            name: 'Product Hero Banner',
            type: 'image',
            category: 'Product',
            status: 'Draft',
            views: 0,
            likes: 0,
            createdAt: '5 hours ago',
            thumbnail: 'https://via.placeholder.com/60x60/10b981/ffffff?text=I'
        },
        {
            id: 3,
            name: 'Tech Review Video',
            type: 'video',
            category: 'Technology',
            status: 'Published',
            views: 892,
            likes: 67,
            createdAt: '1 day ago',
            thumbnail: 'https://via.placeholder.com/60x60/6366f1/ffffff?text=V'
        },
        {
            id: 4,
            name: 'Lifestyle Photography',
            type: 'image',
            category: 'Lifestyle',
            status: 'Published',
            views: 634,
            likes: 45,
            createdAt: '2 days ago',
            thumbnail: 'https://via.placeholder.com/60x60/10b981/ffffff?text=I'
        }
    ];

    const popularTemplates = [
        { name: 'Fashion Rotation', category: 'Fashion', usage: 92, type: 'video' },
        { name: 'Product Showcase', category: 'Product', usage: 87, type: 'image' },
        { name: 'Lifestyle Hero', category: 'Lifestyle', usage: 79, type: 'video' },
        { name: 'Tech Demo', category: 'Technology', usage: 73, type: 'video' },
        { name: 'Brand Story', category: 'Marketing', usage: 68, type: 'image' }
    ];

    const quickActions = [
        {
            title: 'Create Video',
            description: 'Start with video templates',
            icon: PlayIcon,
            color: 'primary',
            count: '89 templates',
            href: '/video/templates'
        },
        {
            title: 'Create Image',
            description: 'Browse image templates',
            icon: ImageIcon,
            color: 'success',
            count: '53 templates',
            href: '/image/templates'
        },
        {
            title: 'Browse Favorites',
            description: 'Your saved templates',
            icon: HeartIcon,
            color: 'critical',
            count: '24 saved',
            href: '/favorites'
        },
        {
            title: 'Recent Projects',
            description: 'Continue your work',
            icon: ClockIcon,
            color: 'warning',
            count: '8 drafts',
            href: '/projects'
        }
    ];

    const StatCard = ({ title, value, subtitle, icon: IconComponent, trend, color = 'subdued' }) => (
        <Card>
            <Box padding="400">
                <BlockStack gap="300">
                    <InlineStack align="space-between" blockAlign="center">
                        <InlineStack gap="200" align="center">
                            <div style={{
                                padding: '8px',
                                borderRadius: '6px',
                                backgroundColor: color === 'primary' ? '#e3f2fd' :
                                    color === 'success' ? '#e8f5e8' :
                                        color === 'critical' ? '#ffeaea' :
                                            color === 'warning' ? '#fff3cd' : '#f5f5f5'
                            }}>
                                <Icon source={IconComponent} tone={color} />
                            </div>
                            <Text variant="bodyMd" tone="subdued">{title}</Text>
                        </InlineStack>
                        {trend && (
                            <Badge tone={trend.startsWith('+') ? 'success' : 'critical'}>
                                {trend}
                            </Badge>
                        )}
                    </InlineStack>

                    <BlockStack gap="100">
                        <Text variant="heading2xl" as="h3" fontWeight="bold">
                            {typeof value === 'number' ? value.toLocaleString() : value}
                        </Text>
                        {subtitle && (
                            <Text variant="bodySm" tone="subdued">{subtitle}</Text>
                        )}
                    </BlockStack>
                </BlockStack>
            </Box>
        </Card>
    );

    const QuickActionCard = ({ title, description, icon: IconComponent, count, color, href }) => (
        <Card>
            <Box padding="400">
                <BlockStack gap="400">
                    <BlockStack gap="200">
                        <InlineStack gap="200" align="center">
                            <div style={{
                                padding: '12px',
                                borderRadius: '8px',
                                backgroundColor: color === 'primary' ? '#e3f2fd' :
                                    color === 'success' ? '#e8f5e8' :
                                        color === 'critical' ? '#ffeaea' : '#fff3cd'
                            }}>
                                <Icon source={IconComponent} tone={color} />
                            </div>
                            <BlockStack gap="050">
                                <Text variant="bodyMd" fontWeight="semibold">{title}</Text>
                                <Text variant="bodySm" tone="subdued">{description}</Text>
                            </BlockStack>
                        </InlineStack>

                        <Text variant="bodySm" tone="subdued">{count}</Text>
                    </BlockStack>

                    <Button
                        fullWidth
                        variant={color === 'primary' ? 'primary' : 'secondary'}
                        onClick={() => window.location.href = href}
                    >
                        Get Started
                    </Button>
                </BlockStack>
            </Box>
        </Card>
    );

    const ProjectCard = ({ project }) => (
        <Card>
            <Box padding="400">
                <BlockStack gap="200">
                    <InlineStack gap="300" align="center" wrap={false}>
                        <Thumbnail
                            source={project.thumbnail}
                            alt={project.name}
                            size="small"
                        />
                        <BlockStack gap="100">
                            <InlineStack gap="200" align="center" wrap>
                                <Text variant="bodyMd" fontWeight="semibold" breakWord>{project.name}</Text>
                                <Badge tone={project.status === 'Published' ? 'success' : 'warning'}>
                                    {project.status}
                                </Badge>
                            </InlineStack>
                            <InlineStack gap="300" wrap>
                                <Badge tone="info">{project.category}</Badge>
                                <Text variant="bodySm" tone="subdued">{project.createdAt}</Text>
                            </InlineStack>
                        </BlockStack>
                    </InlineStack>

                    <InlineStack gap="400" align="space-between" wrap>
                        <InlineStack gap="400" wrap>
                            <InlineStack gap="100" align="center">
                                <Icon source={ViewIcon} tone="subdued" />
                                <Text variant="bodySm" tone="subdued">{project.views.toLocaleString()}</Text>
                            </InlineStack>
                            <InlineStack gap="100" align="center">
                                <Icon source={HeartIcon} tone="subdued" />
                                <Text variant="bodySm" tone="subdued">{project.likes}</Text>
                            </InlineStack>
                        </InlineStack>
                        <Button size="slim" variant="plain">
                            View
                        </Button>
                    </InlineStack>
                </BlockStack>
            </Box>
        </Card>
    );

    return (
        <Page
            title="Dashboard"
            subtitle="Welcome back! Here's what's happening with your templates."
            fullWidth
            primaryAction={{
                content: 'Create New',
                icon: PlusIcon,
                onAction: () => console.log('Create new')
            }}
            secondaryActions={[
                {
                    content: 'View Analytics',
                    icon: ChartVerticalIcon,
                    onAction: () => console.log('View analytics')
                }
            ]}
        >
            <BlockStack gap="600">
                {/* Welcome Banner */}
                <Banner tone="info">
                   {/* InlineStack is a layout component that arranges its children horizontally using CSS Flexbox, just like how BlockStack does it vertically. */}
                    <InlineStack gap="200" align="center">
                        <Icon source={StarIcon} />
                        <Text variant="bodyMd">
                            You've created 12 templates this month! Keep up the great work.
                        </Text>
                    </InlineStack>
                </Banner>

                {/* Key Metrics */}
                <BlockStack gap="400">
                    <Text variant="headingLg" as="h2">Overview</Text>
                    <Grid>
                        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 3, xl: 3 }}>
                            <StatCard
                                title="Total Projects"
                                value={stats.totalProjects}
                                subtitle="All time"
                                icon={ChartVerticalIcon}
                                color="primary"
                            />
                        </Grid.Cell>
                        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 3, xl: 3 }}>
                            <StatCard
                                title="Total Views"
                                value={stats.totalViews}
                                subtitle="This month"
                                icon={ViewIcon}
                                trend={stats.weeklyGrowth}
                                color="success"
                            />
                        </Grid.Cell>
                        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 3, xl: 3 }}>
                            <StatCard
                                title="Total Likes"
                                value={stats.totalLikes}
                                subtitle="Across all projects"
                                icon={HeartIcon}
                                color="critical"
                            />
                        </Grid.Cell>
                        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 3, xl: 3 }}>
                            <StatCard
                                title="Downloads"
                                value={stats.totalDownloads}
                                subtitle="This month"
                                icon={ArrowDownIcon}
                                color="warning"
                            />
                        </Grid.Cell>
                    </Grid>
                </BlockStack>

                {/* Quick Actions */}
                <BlockStack gap="400">
                    <Text variant="headingLg" as="h2">Quick Actions</Text>
                    <Grid>
                        {quickActions.map((action, index) => (
                            <Grid.Cell key={index} columnSpan={{ xs: 6, sm: 6, md: 6, lg: 3, xl: 3 }}>
                                <QuickActionCard {...action} />
                            </Grid.Cell>
                        ))}
                    </Grid>
                </BlockStack>

                {/* Main Content Grid */}
                <Grid>
                    {/* Recent Projects */}
                    <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 8, xl: 8 }}>
                        <Card>
                            <Box padding="400">
                                <BlockStack gap="400">
                                    <InlineStack align="space-between">
                                        <Text variant="headingMd" as="h3">Recent Projects</Text>
                                        <Button variant="plain" size="slim">View All</Button>
                                    </InlineStack>

                                    <BlockStack gap="300">
                                        {recentProjects.map((project) => (
                                            <ProjectCard key={project.id} project={project} />
                                        ))}
                                    </BlockStack>
                                </BlockStack>
                            </Box>
                        </Card>
                    </Grid.Cell>

                    {/* Popular Templates */}
                    <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 4, xl: 4 }}>
                        <Card>
                            <Box padding="400">
                                <BlockStack gap="400">
                                    <Text variant="headingMd" as="h3">Popular Templates</Text>

                                    <BlockStack gap="300">
                                        {popularTemplates.map((template, index) => (
                                            <Box key={index}>
                                                <BlockStack gap="200">
                                                    <InlineStack align="space-between" blockAlign="center">
                                                        <InlineStack gap="200" align="center">
                                                            <Icon
                                                                source={template.type === 'video' ? PlayIcon : ImageIcon}
                                                                tone={template.type === 'video' ? 'primary' : 'success'}
                                                            />
                                                            <BlockStack gap="050">
                                                                <Text variant="bodyMd" fontWeight="medium">{template.name}</Text>
                                                                <Text variant="bodySm" tone="subdued">{template.category}</Text>
                                                            </BlockStack>
                                                        </InlineStack>
                                                        <Text variant="bodySm" fontWeight="medium">{template.usage}%</Text>
                                                    </InlineStack>
                                                    <ProgressBar
                                                        progress={template.usage}
                                                        size="small"
                                                        tone={template.type === 'video' ? 'primary' : 'success'}
                                                    />
                                                </BlockStack>
                                                {index < popularTemplates.length - 1 && <Divider />}
                                            </Box>
                                        ))}
                                    </BlockStack>
                                </BlockStack>
                            </Box>
                        </Card>
                    </Grid.Cell>
                </Grid>

                {/* Template Categories */}
                <BlockStack gap="400">
                    <Text variant="headingLg" as="h2">Create Content</Text>
                    <Grid>
                        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                            <Card>
                                <Box padding="500">
                                    <BlockStack gap="400">
                                        <InlineStack gap="300" align="center">
                                            <div style={{
                                                padding: '16px',
                                                borderRadius: '12px',
                                                backgroundColor: '#e3f2fd'
                                            }}>
                                                <Icon source={PlayIcon} tone="primary" />
                                            </div>
                                            <BlockStack gap="100">
                                                <Text variant="headingMd" as="h3">Video Templates</Text>
                                                <Text variant="bodyMd" tone="subdued">
                                                    {stats.videoTemplates} professional templates
                                                </Text>
                                            </BlockStack>
                                        </InlineStack>

                                        <Text variant="bodyMd">
                                            Create engaging video content with our collection of professional templates.
                                            Perfect for product showcases, fashion content, lifestyle videos, and more.
                                        </Text>

                                        <InlineStack gap="200">
                                            <Badge tone="info">Fashion</Badge>
                                            <Badge tone="info">Product</Badge>
                                            <Badge tone="info">Lifestyle</Badge>
                                            <Badge tone="info">Tech</Badge>
                                        </InlineStack>

                                        <Button
                                            primary
                                            fullWidth
                                            icon={PlayIcon}
                                            onClick={() => window.location.href = '/video/templates'}
                                        >
                                            Browse Video Templates
                                        </Button>
                                    </BlockStack>
                                </Box>
                            </Card>
                        </Grid.Cell>

                        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                            <Card>
                                <Box padding="500">
                                    <BlockStack gap="400">
                                        <InlineStack gap="300" align="center">
                                            <div style={{
                                                padding: '16px',
                                                borderRadius: '12px',
                                                backgroundColor: '#e8f5e8'
                                            }}>
                                                <Icon source={ImageIcon} tone="success" />
                                            </div>
                                            <BlockStack gap="100">
                                                <Text variant="headingMd" as="h3">Image Templates</Text>
                                                <Text variant="bodyMd" tone="subdued">
                                                    {stats.imageTemplates} professional templates
                                                </Text>
                                            </BlockStack>
                                        </InlineStack>

                                        <Text variant="bodyMd">
                                            Design stunning static images for your products and campaigns.
                                            Choose from professionally crafted templates for all your needs.
                                        </Text>

                                        <InlineStack gap="200">
                                            <Badge tone="success">Heroes</Badge>
                                            <Badge tone="success">Banners</Badge>
                                            <Badge tone="success">Social</Badge>
                                            <Badge tone="success">Ads</Badge>
                                        </InlineStack>

                                        <Button
                                            fullWidth
                                            icon={ImageIcon}
                                            onClick={() => window.location.href = '/image/templates'}
                                        >
                                            Browse Image Templates
                                        </Button>
                                    </BlockStack>
                                </Box>
                            </Card>
                        </Grid.Cell>
                    </Grid>
                </BlockStack>
            </BlockStack>
        </Page>
    );
};

export default Dashboard;