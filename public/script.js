function getHashParams() {
  let hashParams = {};
  let e;
  let r = /([^&;=]+)=?([^&;]*)/g
  let q = window.location.hash.substring(1);
  while (e = r.exec(q)) {
    hashParams[e[1]] = decodeURIComponent(e[2]);
  }
  return hashParams
}
function fixedEncodeURIComponent(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
    return '%' + c.charCodeAt(0).toString(16);
  });
}

class Container extends React.Component{
  constructor() {
    super();
    this.state = {
      access_token: false,
      refresh_token: false,
      userData: false,
      artistSearched: false,
      artistRes: {},
      forceData: false,
    }
  }
  componentWillMount() {
    let params = getHashParams()
    params.error ? alert('There was an error during the authentication') : null;
    this.setState({
      access_token: params.access_token,
      refresh_token: params.refresh_token
    })
  }
  componentDidMount() {
    fetch('https://api.spotify.com/v1/me', {headers: {'Authorization': 'Bearer ' + this.state.access_token}})
      .then((res) => res.json())
      .then((json) => {
        console.log('Request succesful', json);
        this.setState({
          userData: json
        });
      })
      .catch((err) => {console.log('Request failed', err)})
  }
  artistSearchResults(search) {
    fetch(`https://api.spotify.com/v1/search?q=${fixedEncodeURIComponent(search)}&type=artist`, {headers: {'Authorization': 'Bearer ' + this.state.access_token}})
      .then((res) => res.json())
      .then((json) => {
        console.log('Request succesful', json);
        this.setState({
          artistSearched: true,
          artistRes: json.artists.items
        });
      })
      .catch((err) => {console.log('Request failed', err)})
  }
  getRelatedArtists(id) {
    fetch(`https://api.spotify.com/v1/artists/${id}/related-artists`, {headers: {'Authorization': 'Bearer ' + this.state.access_token}})
      .then((res) => res.json())
      .then((json) => {
        console.log('Request succesful', json);
        let nodes = json.artists.map(function(val) {
          return {"id": val.id, "name": val.name, "image": val.images.pop()}
        })
        let links = json.artists.map(function(val) {
          return {"source": id, "target": val.id}
        })
        let source = this.state.artistRes.find((obj) => (obj.id === id))
        nodes.push({
          "id": source.id, "name": source.name, "image": source.images.pop()
        })
        this.setState({
          forceData: {"nodes": nodes, "links": links}
        }) 
      })
      .catch((err) => {console.log('Request failed', err)})
  }
  render() {
    if (!this.state.userData) {
      return (
        <Login />
      )
    }
    return (
      <div>
        <ArtistSearch newSearch={(f) => this.artistSearchResults(f)} />
        {this.state.artistSearched ? <ArtistsList artistId={(id) => this.getRelatedArtists(id)} results={this.state.artistRes} access_token={this.state.access_token} /> : null}
        {this.state.forceData ? <Chart forceData={this.state.forceData} /> : null}
      </div>
    )
  }
}

class Chart extends React.Component {
  componentDidMount() {
    let el = ReactDOM.findDOMNode(this);
    d3Chart.create(el, null, this.getChartState())
  }
  componentDidUpdate() {
    let el = ReactDOM.findDOMNode(this);
    d3Chart.update(el, this.getChartState())
  }
  getChartState() {
    return this.props.forceData
  }
  componentWillUnmount() {
    let el = ReactDOM.findDOMNode(this);
    d3Chart.destroy(el);
  }
  render() {
    return (
      <div className="d3"></div>
    )
  }
}

class ArtistSearch extends React.Component {
  constructor() {
    super()
    this.state = {
      artistSearch: ''
    }
  }
  updateNewSearch(e) {
    this.setState({
      artistSearch: e.target.value
    });
  }
  handleArtistSearch() {
    this.props.newSearch(this.state.artistSearch);
    this.setState({
      artistSearch: ''
    })
  }
  render() {
    return (
      <div>
        <input type="text" value={this.state.artistSearch} onChange= {(e) => this.updateNewSearch(e)} />
        <button onClick={(e) => this.handleArtistSearch(e)}>Search Artists</button>
      </div>
    )
  }
}
class ArtistsList extends React.Component {
  constructor() {
    super()
    this.state = {
      clicked: false
    }
  }
  wonkyPassUp(id) {
    // TODO replace with event dispatcher or something better
    this.props.artistId(id)
  }
  render() {
    return (
      <div>
        {this.props.results.map((artist, index) => (
          <Artist artistId={(id) => this.wonkyPassUp(id)} artist={artist} key={index} />
        ))}
      </div>
    )
  }
}
class Artist extends React.Component {
  handleClick(e) {
    this.props.artistId(this.props.artist.id);
  }
  render() {
    return (
      <div key={this.props.artist.id}>
        <p>Name: {this.props.artist.name}</p>
        {(this.props.artist.images.length > 0) ? <img width="64" src={this.props.artist.images[0].url} alt="profile image" /> : null}
        <button onClick={(e) => this.handleClick(e)}>Get Related Artists</button>
      </div>
    )
  }
}
class Login extends React.Component{
  render() {
    return (
      <div id="login">
        <h1>Test of Auth Code</h1>
        <a href="/login">Log in with Spotify</a>
      </div>
    )
  }
}

ReactDOM.render(
  <Container />,
  document.getElementById('app')
);