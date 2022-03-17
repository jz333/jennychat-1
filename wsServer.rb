# ##############################################
# # Using faye-websocket
# ##############################################

require 'faye/websocket'
require 'rack'
require 'base64'



class MyServer

  def initialize(socket_port, socket_host)
    @socket_port = socket_port
    @socket_host = socket_host

    @clients = []
    @clientHash = Hash.new
    @wsServer = wsServer
    start_server
  end


  def wsServer
    wsServer = lambda do |env|
    # inspect env to see if the incoming request is a WebSocket request
      if Faye::WebSocket.websocket?(env)
        # It is a WebSocket connection
        # set :ping to 30 sec: server send a ping to client every 30 sec to keep the connection
        ws = Faye::WebSocket.new(env, [], :ping => 30)


        # open gets invoked when a new connection to the server happens
        # store a newly connected client in the @clients array
        ws.on :open do |event|
          puts "Connection open with ws #{ws.object_id}."
          ws.send("Welcome to the chat room! Start chatting!")
          @clients << ws

          puts "In the chat room: "
          @clients.each {|client| puts client}

          # # send current userList to clients
          # @clients.each { |client|
          #   ws.send("In the chat room: #{client}")
          # }

          # send existing user list to the new connected client
          @clientHash.keys.each do |client|
            ws.send("add_to_userList: #{@clientHash[client]}")
          end

          # ##########################
          # # send image via base64 encoded string
          # ##########################
          # f = Base64.encode64(File.open("mochi.png", "rb").read)
          # #f = File.open("mochi.jpg", "rb").read
          # #puts f
          # ws.send(f)
          # ##########################
          # ##########################

        end


        # message gets invoked when a WebSocket message is received
        # by the server. The event object passed in has a 'data' attribute
        # which is the message being sent
        ws.on :message do |event|
          # initial onopen msg from client (set to define username)
          if event.data.start_with?('set_display_username: ')
            pos = 'set_display_username: '.length
            username = event.data[pos..]
            @clientHash[ws] = username  # add username to hash

            # announce to other user a new client is joining
            @clientHash.keys.each do |client|
              if @clientHash[client] != username
                client.send("#{username} has joined!")

                # tell client to update userList, this msg will not
                # be displayed with special client side setting
                client.send("add_to_userList: #{username}")
              end
            end

            #puts username

          # elsif event.data.start_with?('SERVER_SETTING_SENDING_IMAGES: ')
          #   pos = 'SERVER_SETTING_SENDING_IMAGES: '.length
          #   msg = event.data[pos..]

          else
            # all other msgs
            #puts "Client: #{event.data}"

            # broadcase to clients
            @clients.each { |client|
              client.send("#{event.data}")  # identify which client from client side
              #client.send("#{ws}: #{event.data}")  #identify which client from server side


              # if client != ws
              #     client.send("#{ws}: #{event.data}")
              # end
            }

          end


        end


        # close gets invoked when the client closes the connection
        # remove the client from client list when disconnected
        ws.on :close do |event|
          puts "Closing the connection with #{ws}..."
          puts "close, #{ws.object_id}, #{event.code}, #{event.reason}"

          @clients.delete(ws)

          # broadcast to all other users
          @clients.each { |client| client.send("#{@clientHash[ws]} has left.")}

          # delete in userList of current users
          @clients.each { |client| client.send("delete_from_userList: #{@clientHash[ws]}")}

          @clientHash.delete(ws) # delete this user from hash

          ws = nil
        end


        # Return async Rack response
        # this line is essential!
        ws.rack_response

      else
        #####################################
        # Normal HTTP request
        #####################################

        # puts env['rack.input']
        #puts env
        handle_http_request(env['REQUEST_METHOD'], env['PATH_INFO'], env['rack.input'], env)

      end
    end

  end

  def handle_http_request(method, path, data, env)
    if method == "GET"
      [200,
      {"Content-Type" => "text/html",
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS,POST,PUT',
      'Access-Control-Allow-Headers': 'Origin, Access-Control-Allow-Origin, X-Requested-With, Content-Type, Accept, body, Authorization'},
      ["You have requested the path #{path}, using GET"]]

    elsif method == "OPTIONS"
      #puts path
      [200,
      { "Content-Type" => "text/html",
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS,POST,PUT',
      'Access-Control-Allow-Headers': 'Origin, Access-Control-Allow-Origin, X-Requested-With, Content-Type, Accept, body, Authorization'},
      ['Access Allowed.']]
    elsif method == "POST"
      # puts method
      # puts data


      req = Rack::Request.new(env)
      puts req.params

      # {"my-name-1"=>{:filename=>"mochi.png", :type=>"image/png", :name=>"my-name-1",
      # :tempfile=>#<Tempfile:/var/folders/jd/40ppm15s4lq9wdr_wb57r0lr0000gn/T
      # /RackMultipart20220314-48242-7v7vw6.png>, :head=>"Content-Disposition: form-data;
      # name=\"my-name-1\"; filename=\"mochi.png\"\r\nContent-Type: image/png\r\n"}}


      req.params.keys.each { |file|
        filedata = req.params[file]
        #filename = filedata[:filename]
        filename = file
        puts filename

        filepath = filedata[:tempfile].path

        #puts file

        #unless File.exist?("public/images/#{filename}")
        File.open("public/images/#{filename}", 'w+') do |f|
          f.write File.read(filepath)
        end
      }

      [200,
      { "Content-Type" => "text/html",
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS,POST,PUT',
      'Access-Control-Allow-Headers': 'Origin, Access-Control-Allow-Origin, X-Requested-With, Content-Type, Accept, body, Authorization'},
      ['Receiving.']]

    end
  end




  def start_server
    # run the server on thin
    # load adapter to be able to upgrade handshake to websocket protocol
    Faye::WebSocket.load_adapter('thin')

    # use thin.run(wsServer,...) to run the lambda and get env
    thin = Rack::Handler.get('thin')
    thin.run(@wsServer, :Host => @socket_host, :Port => @socket_port) do |server|
      #You can set options on the server here, for example to set up SSL:
      # if secure
      #   server.ssl_options = {
      #     :private_key_file => 'path/to/ssl.key',
      #     :cert_chain_file  => 'path/to/ssl.crt'
      #   }
      #   server.ssl = true
    end


    ############################################################
    # use a seperate server for static file serving
    # see staticServer.rb

    # # normal HTTP request
    # # static file serve set up
    # Rack::Handler::Thin.run(Rack::Builder.new {
    #     use(Rack::Static, urls: ["/"], root: "public")
    #     run ->env{[200, {}, [some_dyamically_generated_content]]}
    #     }, Port: 4568)
    ############################################################

  end

end



MyServer.new(4567, 'localhost')


