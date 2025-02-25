import React, { useEffect, useState } from "react";
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';

// At the very top of the file, after the other imports
import polygonLogo from './assets/polygonlogo.png';
import ethLogo from './assets/ethlogo.png';
import tdrlogo from 'src/assets/120px-tall-logo-transp--shad.png';
import { networks } from './utils/networks';


import contractAbi from './Domains.json';
import { ethers } from "ethers";

// Constants
const TWITTER_HANDLE = 'thirdyxyz';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const tld = '.thirdy';
const CONTRACT_ADDRESS = '0xebE1Ca853bF937C35F2d1694c8547b6B99e60a05';

const App = () => {


  //Just a state variable we use to store our user's public wallet. Don't forget to import useState at the top.
  // Create a stateful variable to store the network next to all the others
  	const [network, setNetwork] = useState('');
	const [currentAccount, setCurrentAccount] = useState('');
	// Add some state data propertie
	const [domain, setDomain] = useState('');
  const [record, setRecord] = useState('');

  	const [editing, setEditing] = useState(false);
  const [mints, setMints] = useState([]);
	

const checkIfWalletIsConnected = async () => {
		const { ethereum } = window;

		if (!ethereum) {
			console.log('Make sure you have metamask!');
			return;
		} else {
			console.log('We have the ethereum object', ethereum);
		}

		const accounts = await ethereum.request({ method: 'eth_accounts' });

		if (accounts.length !== 0) {
			const account = accounts[0];
			console.log('Found an authorized account:', account);
			setCurrentAccount(account);
		} else {
			console.log('No authorized account found');
		}

  		// This is the new part, we check the user's network chain ID
		const chainId = await ethereum.request({ method: 'eth_chainId' });
  console.log(chainId)
		setNetwork(networks[chainId]);

		ethereum.on('chainChanged', handleChainChanged);
		
		// Reload the page when they change networks
		function handleChainChanged(_chainId) {
			window.location.reload();
		}
	};


  // Implement your connectWallet method here
	const connectWallet = async () => {
		try {
			const { ethereum } = window;

			if (!ethereum) {
				alert("Get MetaMask -> https://metamask.io/");
				return;
			}

			// Fancy method to request access to account.
			const accounts = await ethereum.request({ method: "eth_requestAccounts" });
		
			// Boom! This should print out public address once we authorize Metamask.
			console.log("Connected", accounts[0]);
			setCurrentAccount(accounts[0]);
		} catch (error) {
			console.log(error)
		}
	}

  // Add this function anywhere in your component (maybe after the mint function)
const fetchMints = async () => {
	try {
		const { ethereum } = window;
		if (ethereum) {
			// You know all this
			const provider = new ethers.providers.Web3Provider(ethereum);
			const signer = provider.getSigner();
			const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
				
			// Get all the domain names from our contract
			const names = await contract.getAllNames();
				
			// For each name, get the record and the address
			const mintRecords = await Promise.all(names.map(async (name) => {
			const mintRecord = await contract.records(name);
			const owner = await contract.domains(name);
			return {
				id: names.indexOf(name),
				name: name,
				record: mintRecord,
				owner: owner,
			};
		}));

		console.log("MINTS FETCHED ", mintRecords);
		setMints(mintRecords);
		}
	} catch(error){
		console.log(error);
	}
}

  // This will run any time currentAccount or network are changed
useEffect(() => {
	if (network === 'Polygon Mumbai Testnet') {
		fetchMints();
	}
}, [currentAccount, network]);

	// Create a function to render if wallet is not connected yet
	const renderNotConnectedContainer = () => (
		<div className="connect-wallet-container">     
			<img src="https://media4.giphy.com/media/l3q2Xl2Rd8wZfMCaI/giphy.gif?cid=790b761144ed23fd124c526e1ab8f4072859b5c7a02763a0&rid=giphy.gif&ct=g" alt="space" />
			<button onClick={connectWallet}  className="cta-button connect-wallet-button">
				Connect Wallet
			</button>
		</div>
  	);

	// This runs our function when the page loads.
	useEffect(() => {
		checkIfWalletIsConnected();
	}, [])


  // Form to enter domain name and data
	const renderInputForm = () =>{
console.log(network)

    if (network !== 'Polygon Mumbai Testnet') {
		return (
			<div className="connect-wallet-container">
				<h2>Please switch to Polygon Mumbai Testnet</h2>
				{/* This button will call our switch network function */}
				<button className='cta-button switch-button' onClick={switchNetwork}>Click here to switch network</button>
			</div>
		);
	}
    
		return (
			<div className="form-container">
				<div className="first-row">
					<input
						type="text"
						value={domain}
						placeholder='domain'
						onChange={e => setDomain(e.target.value)}
					/>
					<p className='tld'> {tld} </p>
				</div>

				<input
					type="text"
					value={record}
					placeholder='whats ur email address'
					onChange={e => setRecord(e.target.value)}
				/>

					{editing ? (
						<div className="button-container">
							<button className='cta-button mint-button' onClick={updateDomain}>Set record</button>  
							<button className='cta-button mint-button' onClick={() => {setEditing(false)}}>
								Cancel</button> </div>
					) : (
						<button className='cta-button mint-button' onClick={mintDomain}>Mint</button>  
					)}
			</div>
		);
  };

  const updateDomain = async () => {
	if (!record || !domain) { return }
	console.log("Updating domain", domain, "with record", record);
  	try {
		const { ethereum } = window;
		if (ethereum) {
			const provider = new ethers.providers.Web3Provider(ethereum);
			const signer = provider.getSigner();
			const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);

			let tx = await contract.setRecord(domain, record);
			await tx.wait();
			console.log("Record set https://mumbai.polygonscan.com/tx/"+tx.hash);

			fetchMints();
			setRecord('');
			setDomain('');
		}
  	} catch(error) {
    	console.log(error);
  	}
}
  
const mintDomain = async () => {
	// Don't run if the domain is empty
	if (!domain) { return }
	// Alert the user if the domain is too short
	if (domain.length < 3) {
		alert('Domain must be at least 3 characters long');
		return;
	}
	// Calculate price based on length of domain (change this to match your contract)	
	// 3 chars = 0.5 MATIC, 4 chars = 0.3 MATIC, 5 or more = 0.1 MATIC
	const price = domain.length === 3 ? '0.005' : domain.length === 4 ? '0.003' : '0.001';
	console.log("Minting domain", domain, "with price", price);
  try {
    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);

			console.log("Going to pop wallet now to pay gas...")
      let tx = await contract.register(domain, {value: ethers.utils.parseEther(price)});
      // Wait for the transaction to be mined
			const receipt = await tx.wait();

			// Check if the transaction was successfully completed
			if (receipt.status === 1) {
				console.log("Domain minted! https://mumbai.polygonscan.com/tx/"+tx.hash);
				
				// Set the record for the domain
				tx = contract.setRecord(domain, record);
				await tx.wait();

        				// Call fetchMints after 2 seconds
				setTimeout(() => {
					fetchMints();
				}, 2000);

				console.log("Record set! https://mumbai.polygonscan.com/tx/"+tx.hash);
				
				setRecord('');
				setDomain('');
			}
			else {
				alert("Transaction failed! Please try again");
			}
    }
  }
  catch(error){
    console.log(error);
  }
}

  // Add this render function next to your other render functions
const renderMints = () => {
	if (currentAccount && mints.length > 0) {
		return (
			<div className="mint-container">
				<p className="subtitle"> Recently minted domains!</p>
				<div className="mint-list">
					{ mints.map((mint, index) => {
						return (
							<div className="mint-item" key={index}>
								<div className='mint-row'>
									<a className="link" href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}`} target="_blank" rel="noopener noreferrer">
										<p className="underlined">{' '}{mint.name}{tld}{' '}</p>
									</a>
									{/* If mint.owner is currentAccount, add an "edit" button*/}
									{ mint.owner.toLowerCase() === currentAccount.toLowerCase() ?
										<button className="edit-button" onClick={() => editRecord(mint.name)}>
											<img className="edit-icon" src="https://img.icons8.com/metro/26/000000/pencil.png" alt="Edit button" />
										</button>
										:
										null
									}
								</div>
					<p> {mint.record} </p>
				</div>)
				})}
			</div>
		</div>);
	}
};

// This will take us into edit mode and show us the edit buttons!
const editRecord = (name) => {
	console.log("Editing record for", name);
	setEditing(true);
	setDomain(name);
}
  
  const switchNetwork = async () => {
	if (window.ethereum) {
		try {
			// Try to switch to the Mumbai testnet
			await window.ethereum.request({
				method: 'wallet_switchEthereumChain',
				params: [{ chainId: '0x13881' }], // Check networks.js for hexadecimal network ids
			});
		} catch (error) {
			// This error code means that the chain we want has not been added to MetaMask
			// In this case we ask the user to add it to their MetaMask
			if (error.code === 4902) {
				try {
					await window.ethereum.request({
						method: 'wallet_addEthereumChain',
						params: [
							{	
								chainId: '0x13881',
								chainName: 'Polygon Mumbai Testnet',
								rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
								nativeCurrency: {
										name: "Mumbai Matic",
										symbol: "MATIC",
										decimals: 18
								},
								blockExplorerUrls: ["https://mumbai.polygonscan.com/"]
							},
						],
					});
				} catch (error) {
					console.log(error);
				}
			}
			console.log(error);
		}
	} else {
		// If window.ethereum is not found then MetaMask is not installed
		alert('MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html');
	} 
}
  
	return (
		<div className="App">
			<div className="container">
				<div className="header-container">
					<header>
						<div className="left">
						<P><img alt="Logo" classname="logo" src="src/assets/120px-tall-logo-transp--shad.png" /> </p>
						<p className="title"> Thirdy Domain Registry </p>
						<p className="subtitle">Mint your .thirdy member domain!</p>
						</div>
            <div className="right">
			<img alt="Network logo" className="logo" src={ network.includes("Polygon") ? polygonLogo : ethLogo} />
			{ currentAccount ? <p> Wallet: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)} </p> : <p> Not connected </p> }
		</div>
					</header>
				</div>


        {!currentAccount && renderNotConnectedContainer()}
{currentAccount && renderInputForm()}
{mints && renderMints()}

			</div>
		</div>
	);
};

export default App;
