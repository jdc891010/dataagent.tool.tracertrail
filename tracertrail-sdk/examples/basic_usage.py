"""Basic usage examples for TraceTrail SDK."""
from tracertrail import TraceTrail


def main():
    """Run basic examples."""
    
    # Initialize the client
    print("Initializing TraceTrail client...")
    tt = TraceTrail(
        api_url="http://localhost:8081/api",
        api_key="sk_3c534e68d6308ad314b3bd54545b6e3886e5df51a4f6f13b4f67a548e26bbeb1",
    )
    
    # List projects
    print("\n=== Projects ===")
    projects = tt.list_projects()
    print(f"Found {len(projects)} projects:")
    for p in projects[:3]:
        print(f"  - {p.get('name', 'Unnamed')}")
    
    # List datasets
    print("\n=== Datasets ===")
    datasets = tt.list_datasets()
    print(f"Found {len(datasets)} datasets")
    
    # List data sources
    print("\n=== Data Sources ===")
    datasources = tt.list_datasources()
    print(f"Found {len(datasources)} data sources")
    
    # List issues
    print("\n=== Issues ===")
    issues = tt.list_issues()
    print(f"Found {len(issues)} issues")
    for i in issues[:3]:
        print(f"  - {i.get('title', 'Untitled')} ({i.get('severity', 'unknown')})")
    
    # List vault solutions
    print("\n=== Vault Solutions ===")
    solutions = tt.list_solutions()
    print(f"Found {len(solutions)} solutions")
    
    # List API keys
    print("\n=== API Keys ===")
    keys = tt.list_api_keys()
    print(f"Found {len(keys)} API keys")
    
    # List MCP tools
    print("\n=== MCP Tools ===")
    tools = tt.list_mcp_tools()
    print(f"Found {len(tools.get('tools', []))} MCP tools")
    
    # Create and delete a project (example of write operation)
    print("\n=== Create/Delete Project ===")
    new_project = tt.create_project(
        name="SDK Test Project",
        description="Created by SDK example"
    )
    print(f"Created project: {new_project['id']}")
    
    deleted = tt.delete_project(new_project['id'])
    print(f"Deleted project: {deleted}")
    
    print("\n=== Done ===")


if __name__ == "__main__":
    main()
