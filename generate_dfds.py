import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

# Set global font and style
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['font.family'] = 'sans-serif'

def draw_entity(ax, x, y, width, height, label, color='#EBF3FA', edge_color='#1E56A0'):
    """Draws a rectangular External Entity box."""
    rect = patches.FancyBboxPatch(
        (x - width/2, y - height/2), width, height,
        boxstyle="round,pad=0.02,rounding_size=0.04",
        facecolor=color, edgecolor=edge_color, linewidth=2, zorder=3
    )
    ax.add_patch(rect)
    ax.text(x, y, label, ha='center', va='center', fontsize=10.5, fontweight='bold', color='#0F2C59', zorder=4, multialignment='center')

def draw_process(ax, x, y, radius_x, radius_y, code, label, color='#FFF5E4', edge_color='#D65A31'):
    """Draws an oval/ellipse Process box."""
    ellipse = patches.Ellipse(
        (x, y), width=radius_x*2, height=radius_y*2,
        facecolor=color, edgecolor=edge_color, linewidth=2, zorder=3
    )
    ax.add_patch(ellipse)
    full_text = f"{code}\n{label}" if code else label
    ax.text(x, y, full_text, ha='center', va='center', fontsize=9.5, fontweight='bold', color='#2D3748', zorder=4, multialignment='center')

def draw_datastore(ax, x, y, width, height, ds_id, label, color='#F0F7F4', edge_color='#2D6A4F'):
    """Draws an open-ended Data Store (parallel horizontal lines)."""
    # Background fill
    rect = patches.Rectangle((x - width/2, y - height/2), width, height, facecolor=color, edgecolor='none', zorder=2)
    ax.add_patch(rect)
    
    # Top and Bottom parallel lines
    ax.plot([x - width/2, x + width/2], [y + height/2, y + height/2], color=edge_color, linewidth=2, zorder=3)
    ax.plot([x - width/2, x + width/2], [y - height/2, y - height/2], color=edge_color, linewidth=2, zorder=3)
    # Left dividing vertical line for ID
    id_w = width * 0.22
    ax.plot([x - width/2 + id_w, x - width/2 + id_w], [y - height/2, y + height/2], color=edge_color, linewidth=1.5, zorder=3)
    # Left closed border line
    ax.plot([x - width/2, x - width/2], [y - height/2, y + height/2], color=edge_color, linewidth=2, zorder=3)
    
    ax.text(x - width/2 + id_w/2, y, ds_id, ha='center', va='center', fontsize=9.5, fontweight='bold', color=edge_color, zorder=4)
    ax.text(x - width/2 + id_w + (width - id_w)/2, y, label, ha='center', va='center', fontsize=9.5, fontweight='bold', color='#1B4332', zorder=4)

def draw_straight_arrow(ax, start, end, label="", label_pos=0.5, text_offset_x=0.0, text_offset_y=0.18, color='#3182CE'):
    """
    Draws a 100% straight horizontal or vertical arrow with non-overlapping label.
    start: (x1, y1), end: (x2, y2)
    """
    ax.annotate(
        "", xy=end, xytext=start,
        arrowprops=dict(
            arrowstyle="-|>",
            color=color,
            linewidth=1.8,
            mutation_scale=12
        ),
        zorder=2
    )
    if label:
        mx = start[0] + (end[0] - start[0]) * label_pos + text_offset_x
        my = start[1] + (end[1] - start[1]) * label_pos + text_offset_y
        ax.text(
            mx, my, label, ha='center', va='center', fontsize=8.2, fontweight='bold',
            color='#1A202C', bbox=dict(boxstyle="round,pad=0.2", facecolor='#FFFFFF', edgecolor='#CBD5E0', linewidth=0.8, alpha=0.95),
            zorder=5
        )

# ==========================================
# 1. CLIENT USER DFD (dfd_client_user_diagram.png)
# ==========================================
def create_client_dfd():
    fig, ax = plt.subplots(figsize=(15, 10), dpi=300)
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 10)
    ax.axis('off')

    # Title
    ax.text(7.5, 9.5, "Fig. 4.2.2.1 Data Flow Diagram - Client User View", ha='center', va='center', fontsize=16, fontweight='bold', color='#1A202C')
    ax.text(7.5, 9.15, "GigSphere - Client Role Operations & Subsystem Data Flows", ha='center', va='center', fontsize=11, fontstyle='italic', color='#4A5568')

    # Single Left External Entity
    draw_entity(ax, 2.0, 5.0, 2.6, 6.8, "Client User\n(Employer)", color='#EBF3FA', edge_color='#1E56A0')

    rows = [
        (1.0, "Post Project &\nSet Budget", "Project Details", "D3", "Projects Table", "Store New Project", 8.0),
        (2.0, "Review Pitches &\nShortlist", "View Proposal Request", "D4", "Pitches Table", "Fetch Pitches", 6.5),
        (3.0, "Award Contract &\nFund Escrow", "Accept Bid & Deposit", "D5", "Contracts Table", "Save Contract & Escrow", 5.0),
        (4.0, "Approve Deliverables\n& Release Payment", "Work Review & Approval", "D6", "Transactions Table", "Record Release Tx", 3.5),
        (5.0, "Rate & Review\nFreelancer", "Rating & Feedback", "D7", "Reviews Table", "Store Review Record", 2.0),
    ]

    for code, p_name, in_lbl, ds_id, ds_name, out_lbl, y_pos in rows:
        # Process Oval
        draw_process(ax, 7.5, y_pos, 1.45, 0.48, f"{code:.1f}", p_name, color='#FFF5E4', edge_color='#DD6B20')
        # Data Store
        draw_datastore(ax, 12.8, y_pos, 2.8, 0.55, ds_id, ds_name, color='#F0F7F4', edge_color='#2D6A4F')

        # Straight Horizontal Arrow 1: Entity -> Process
        draw_straight_arrow(ax, (3.3, y_pos), (6.05, y_pos), in_lbl, label_pos=0.5, text_offset_y=0.18, color='#2B6CB0')
        # Straight Horizontal Arrow 2: Process -> Data Store
        draw_straight_arrow(ax, (8.95, y_pos), (11.4, y_pos), out_lbl, label_pos=0.5, text_offset_y=0.18, color='#2F855A')

    plt.tight_layout()
    output_path = r"c:\Freelancer Marketplace Platform\dfd_client_user_diagram.png"
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated: {output_path}")

# ==========================================
# 2. FREELANCER USER DFD (dfd_freelancer_user_diagram.png)
# ==========================================
def create_freelancer_dfd():
    fig, ax = plt.subplots(figsize=(15, 10), dpi=300)
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 10)
    ax.axis('off')

    # Title
    ax.text(7.5, 9.5, "Fig. 4.2.2.2 Data Flow Diagram - Freelancer User View", ha='center', va='center', fontsize=16, fontweight='bold', color='#1A202C')
    ax.text(7.5, 9.15, "GigSphere - Freelancer Role Operations & Subsystem Data Flows", ha='center', va='center', fontsize=11, fontstyle='italic', color='#4A5568')

    # Single Left External Entity
    draw_entity(ax, 2.0, 5.0, 2.6, 6.8, "Freelancer User\n(Service Provider)", color='#EBF3FA', edge_color='#1E56A0')

    rows = [
        (1.0, "Profile & Portfolio\nSetup", "Skills & Bio Info", "D2", "FreelancerProfile Table", "Update Profile Data", 8.0),
        (2.0, "Search & Browse\nAvailable Gigs", "Search Filters", "D3", "Projects Table", "Query Open Projects", 6.5),
        (3.0, "Submit Pitch &\nBid Proposal", "Proposal & Rate Quote", "D4", "Pitches Table", "Store Pitch Details", 5.0),
        (4.0, "Submit Work &\nMilestone Claim", "Deliverables & Proof", "D5", "Contracts Table", "Update Milestone Status", 3.5),
        (5.0, "Withdraw Earnings &\nCheck Ratings", "Withdraw Request", "D6", "Transactions Table", "Process Wallet Payout", 2.0),
    ]

    for code, p_name, in_lbl, ds_id, ds_name, out_lbl, y_pos in rows:
        # Process Oval
        draw_process(ax, 7.5, y_pos, 1.45, 0.48, f"{code:.1f}", p_name, color='#FFF5E4', edge_color='#DD6B20')
        # Data Store
        draw_datastore(ax, 12.8, y_pos, 2.8, 0.55, ds_id, ds_name, color='#F0F7F4', edge_color='#2D6A4F')

        # Straight Horizontal Arrow 1: Entity -> Process
        draw_straight_arrow(ax, (3.3, y_pos), (6.05, y_pos), in_lbl, label_pos=0.5, text_offset_y=0.18, color='#2B6CB0')
        # Straight Horizontal Arrow 2: Process -> Data Store
        draw_straight_arrow(ax, (8.95, y_pos), (11.4, y_pos), out_lbl, label_pos=0.5, text_offset_y=0.18, color='#2F855A')

    plt.tight_layout()
    output_path = r"c:\Freelancer Marketplace Platform\dfd_freelancer_user_diagram.png"
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated: {output_path}")

# ==========================================
# 3. ADMIN USER DFD (dfd_admin_user_diagram.png)
# ==========================================
def create_admin_dfd():
    fig, ax = plt.subplots(figsize=(15, 10), dpi=300)
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 10)
    ax.axis('off')

    # Title
    ax.text(7.5, 9.5, "Fig. 4.2.2.3 Data Flow Diagram - System Admin View", ha='center', va='center', fontsize=16, fontweight='bold', color='#1A202C')
    ax.text(7.5, 9.15, "GigSphere - Administrator Platform Management & Audit Data Flows", ha='center', va='center', fontsize=11, fontstyle='italic', color='#4A5568')

    # Single Left External Entity
    draw_entity(ax, 2.0, 5.0, 2.6, 6.8, "System Admin\n(Platform Manager)", color='#EBF3FA', edge_color='#1E56A0')

    rows = [
        (1.0, "User Verification &\nAccount Audit", "Verification Request", "D1", "Users Table", "Update User Status", 8.0),
        (2.0, "Category & Skill\nTaxonomy Setup", "Category Definitions", "D9", "Categories Table", "Store Categories", 6.5),
        (3.0, "Monitor Financial\nTransactions", "Audit Criteria", "D6", "Transactions Table", "Fetch Tx Logs", 5.0),
        (4.0, "Dispute & Conflict\nArbitration", "Dispute Ruling", "D8", "Disputes Table", "Update Dispute Ruling", 3.5),
        (5.0, "Platform Performance\n& Trust Reporting", "Report Request", "D7", "Reviews Table", "Generate Trust Metrics", 2.0),
    ]

    for code, p_name, in_lbl, ds_id, ds_name, out_lbl, y_pos in rows:
        # Process Oval
        draw_process(ax, 7.5, y_pos, 1.45, 0.48, f"{code:.1f}", p_name, color='#FFF5E4', edge_color='#DD6B20')
        # Data Store
        draw_datastore(ax, 12.8, y_pos, 2.8, 0.55, ds_id, ds_name, color='#F0F7F4', edge_color='#2D6A4F')

        # Straight Horizontal Arrow 1: Entity -> Process
        draw_straight_arrow(ax, (3.3, y_pos), (6.05, y_pos), in_lbl, label_pos=0.5, text_offset_y=0.18, color='#2B6CB0')
        # Straight Horizontal Arrow 2: Process -> Data Store
        draw_straight_arrow(ax, (8.95, y_pos), (11.4, y_pos), out_lbl, label_pos=0.5, text_offset_y=0.18, color='#2F855A')

    plt.tight_layout()
    output_path = r"c:\Freelancer Marketplace Platform\dfd_admin_user_diagram.png"
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated: {output_path}")

# ==========================================
# 4. LEVEL 0 DFD (dfd_level_0_context_diagram.png) - Clean Straight Orthogonal Lines
# ==========================================
def create_level_0():
    fig, ax = plt.subplots(figsize=(13, 9), dpi=300)
    ax.set_xlim(0, 13)
    ax.set_ylim(0, 9)
    ax.axis('off')

    ax.text(6.5, 8.5, "Fig. 4.2.1 Level 0 Data Flow Diagram (Context Diagram)", ha='center', va='center', fontsize=16, fontweight='bold', color='#1A202C')
    ax.text(6.5, 8.15, "GigSphere Freelancers Marketplace System - Clean Orthogonal Flow", ha='center', va='center', fontsize=11, fontstyle='italic', color='#4A5568')

    # Central System Oval
    draw_process(ax, 6.5, 4.5, 2.0, 1.2, "0.0", "GigSphere\nMarketplace\nPlatform", color='#EBF8FF', edge_color='#2B6CB0')

    # Entities on 4 sides
    draw_entity(ax, 1.8, 4.5, 2.2, 1.1, "Client", color='#EDF2F7', edge_color='#2D3748')
    draw_entity(ax, 11.2, 4.5, 2.2, 1.1, "Freelancer", color='#EDF2F7', edge_color='#2D3748')
    draw_entity(ax, 6.5, 7.5, 2.4, 0.8, "System Admin", color='#F7FAFC', edge_color='#4A5568')
    draw_entity(ax, 6.5, 1.3, 2.6, 0.8, "Payment Gateway\n(Stripe/PayPal)", color='#F7FAFC', edge_color='#4A5568')

    # Perfectly straight parallel horizontal arrows (Client <-> System)
    draw_straight_arrow(ax, (2.9, 4.9), (4.5, 4.9), "Project & Escrow Request", label_pos=0.5, text_offset_y=0.18, color='#2B6CB0')
    draw_straight_arrow(ax, (4.5, 4.1), (2.9, 4.1), "Pitches & Invoices", label_pos=0.5, text_offset_y=-0.22, color='#2B6CB0')

    # Perfectly straight parallel horizontal arrows (Freelancer <-> System)
    draw_straight_arrow(ax, (10.1, 4.9), (8.5, 4.9), "Bids & Work Proposals", label_pos=0.5, text_offset_y=0.18, color='#2B6CB0')
    draw_straight_arrow(ax, (8.5, 4.1), (10.1, 4.1), "Job Feeds & Payouts", label_pos=0.5, text_offset_y=-0.22, color='#2B6CB0')

    # Perfectly straight parallel vertical arrows (Admin <-> System)
    draw_straight_arrow(ax, (5.8, 7.1), (5.8, 5.7), "Dispute Rulings", label_pos=0.5, text_offset_x=-0.7, text_offset_y=0.0, color='#2F855A')
    draw_straight_arrow(ax, (7.2, 5.7), (7.2, 7.1), "Audit Logs", label_pos=0.5, text_offset_x=0.6, text_offset_y=0.0, color='#2F855A')

    # Perfectly straight parallel vertical arrows (Payment Gateway <-> System)
    draw_straight_arrow(ax, (5.8, 3.3), (5.8, 1.7), "Charge Request", label_pos=0.5, text_offset_x=-0.7, text_offset_y=0.0, color='#DD6B20')
    draw_straight_arrow(ax, (7.2, 1.7), (7.2, 3.3), "Payment Confirm", label_pos=0.5, text_offset_x=0.7, text_offset_y=0.0, color='#DD6B20')

    plt.tight_layout()
    output_path = r"c:\Freelancer Marketplace Platform\dfd_level_0_context_diagram.png"
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated: {output_path}")

# ==========================================
# 5. LEVEL 1 OVERVIEW DFD (dfd_level_1_overview_diagram.png)
# ==========================================
def create_level_1():
    fig, ax = plt.subplots(figsize=(15, 11), dpi=300)
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 11)
    ax.axis('off')

    ax.text(7.5, 10.5, "Fig. 4.2.1.1 Data Flow Diagram (Level 1 System Overview)", ha='center', va='center', fontsize=16, fontweight='bold', color='#1A202C')
    ax.text(7.5, 10.15, "GigSphere - Detailed Multi-Subsystem System Flow", ha='center', va='center', fontsize=11, fontstyle='italic', color='#4A5568')

    draw_entity(ax, 2.0, 5.5, 2.6, 8.2, "User / Client /\nFreelancer /\nAdmin", color='#F7FAFC', edge_color='#2D3748')

    processes = [
        (1.0, "Registration &\nAuthentication", 9.4),
        (2.0, "Profile &\nSkill Management", 8.1),
        (3.0, "Post Project &\nJob Listing", 6.8),
        (4.0, "Submit Pitch &\nBid Proposal", 5.5),
        (5.0, "Contract &\nEscrow Setup", 4.2),
        (6.0, "Payment &\nTransaction Processing", 2.9),
        (7.0, "Review &\nTrust Rating", 1.6),
    ]

    for p_code, p_name, py in processes:
        draw_process(ax, 7.5, py, 1.4, 0.48, f"{p_code:.1f}", p_name, color='#FFF5E4', edge_color='#DD6B20')

    datastores = [
        ("D1", "Users Table", 9.4),
        ("D2", "FreelancerProfile Table", 8.1),
        ("D3", "Projects Table", 6.8),
        ("D4", "Pitches Table", 5.5),
        ("D5", "Contracts Table", 4.2),
        ("D6", "Transactions Table", 2.9),
        ("D7", "Reviews & Trust Table", 1.6),
    ]

    for ds_id, ds_name, dsy in datastores:
        draw_datastore(ax, 12.8, dsy, 2.8, 0.55, ds_id, ds_name, color='#F0F7F4', edge_color='#2D6A4F')

    flows = [
        (9.4, "Basic Credentials", "Store User Auth"),
        (8.1, "Profile Details", "Update Profile Data"),
        (6.8, "Project Info", "New Project Record"),
        (5.5, "Bid Details", "Store Pitch Details"),
        (4.2, "Contract Terms", "Store Contract Info"),
        (2.9, "Payment Info", "Payment Record"),
        (1.6, "Feedback Score", "Store Review & Rating"),
    ]

    for py, in_lbl, out_lbl in flows:
        draw_straight_arrow(ax, (3.3, py), (6.1, py), in_lbl, label_pos=0.5, text_offset_y=0.18, color='#2B6CB0')
        draw_straight_arrow(ax, (8.9, py), (11.4, py), out_lbl, label_pos=0.5, text_offset_y=0.18, color='#2F855A')

    plt.tight_layout()
    output_path = r"c:\Freelancer Marketplace Platform\dfd_level_1_overview_diagram.png"
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated: {output_path}")

# ==========================================
# 6. GIGSPHERE OVERALL DFD (dfd_diagram_gigsphere.png)
# ==========================================
def create_gigsphere_dfd():
    fig, ax = plt.subplots(figsize=(15, 10), dpi=300)
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 10)
    ax.axis('off')

    ax.text(7.5, 9.5, "Fig. 4.2.1 Data Flow Diagram (GigSphere Platform Architecture)", ha='center', va='center', fontsize=16, fontweight='bold', color='#1A202C')

    draw_entity(ax, 2.0, 5.0, 2.6, 7.2, "User / Client /\nFreelancer", color='#EBF3FA', edge_color='#1E56A0')

    procs = [
        ("Registration", "Users Table", "Basic Details", "Store Credentials", 8.2),
        ("Profile Management", "FreelancerProfile Table", "Profile Details", "Update Profile Data", 6.9),
        ("Post Project", "Projects Table", "Project Info", "New Project Data", 5.6),
        ("Submit Pitch", "Pitches Table", "Bid Details", "Bid Information", 4.3),
        ("Payment Processing", "Transactions Table", "Payment Details", "Payment Record", 3.0),
        ("Review & Ratings", "Reviews Table", "Feedback Score", "Store Review", 1.7),
    ]

    for idx, (p_label, ds_label, in_label, out_label, y_pos) in enumerate(procs, 1):
        draw_process(ax, 7.5, y_pos, 1.45, 0.48, "", p_label, color='#FFF5E4', edge_color='#D65A31')
        draw_datastore(ax, 12.8, y_pos, 2.8, 0.55, f"D{idx}", ds_label, color='#F0F7F4', edge_color='#2D6A4F')
        
        draw_straight_arrow(ax, (3.3, y_pos), (6.05, y_pos), in_label, label_pos=0.5, text_offset_y=0.18, color='#2B6CB0')
        draw_straight_arrow(ax, (8.95, y_pos), (11.4, y_pos), out_label, label_pos=0.5, text_offset_y=0.18, color='#2F855A')

    plt.tight_layout()
    output_path = r"c:\Freelancer Marketplace Platform\dfd_diagram_gigsphere.png"
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated: {output_path}")

if __name__ == '__main__':
    create_client_dfd()
    create_freelancer_dfd()
    create_admin_dfd()
    create_level_0()
    create_level_1()
    create_gigsphere_dfd()
